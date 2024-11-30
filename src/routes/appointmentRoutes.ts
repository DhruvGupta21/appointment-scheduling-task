import { Router, Request, Response } from "express";
import { ZodError } from "zod";
import { formatError, renderEmailEjs } from "../helper.js";
import prisma from "../config/database.js";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { appointmentSchema } from "../validation/appointmentValidation.js";

const router = Router();

//route to create an appointment, accepts date, time, and doctorID as payload
router.post("/createAppointment", authMiddleware, async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const payload = appointmentSchema.parse(body);

        //check if doctor exists
        let doctor = await prisma.user.findUnique({ where: { id: payload.doctorID } });
        if (!doctor || doctor === null) {
            return res.status(422).json({
                errors: {
                    doctorID: "No doctor found with given ID"
                }
            });
        }

        //check if given doctorID belongs to a doctor
        if (doctor.role !== 'doctor') {
            return res.status(403).json({
                errors: {
                    role: "The user is not authorized as a doctor"
                }
            });
        }

        const requestedDateTime = new Date(`${payload.date}T${payload.time}`);
        const now = new Date();

        //check if the time for appointment is valid time in future
        if (requestedDateTime <= now) {
            return res.status(422).json({
                errors: {
                    datetime: "The appointment time must be in the future."
                }
            });
        }

        // Convert the time range to local timezone (without UTC shift)
        const startRange = new Date(requestedDateTime.getTime() - 30 * 60 * 1000);
        const endRange = new Date(requestedDateTime.getTime() + 30 * 60 * 1000);

        // Format as HH:mm without converting to UTC
        const formatTime = (date: any) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        };

        const greater = formatTime(startRange); // Local start time in HH:mm
        const lesser = formatTime(endRange);   // Local end time in HH:mm

        // Check for overlapping appointments
        const overlappingAppointment = await prisma.appointments.findFirst({
            where: {
                doctorID: payload.doctorID,
                date: payload.date,
                time: {
                    gte: greater,
                    lte: lesser
                },
            },
        });

        if (overlappingAppointment) {
            return res.status(409).json({
                errors: {
                    conflict: "The doctor already has an appointment within ±30 minutes of the requested time"
                }
            });
        }
        const patient = req.user;

        const reminderTime = requestedDateTime.getTime() - 2 * 60 * 60 * 1000; //calculation of reminder time, i.e, 2 hours before the appointment
        const delay = reminderTime - Date.now(); //calculation of delay(in milliseconds) in email, reminderTime - currentTime

        //email format used from appointment-confirm.ejs file
        const emailBody = await renderEmailEjs("appointment-confirm", { name: patient!.name, doctor: doctor.name, date: payload.date, time: payload.time });
        //email added to queue for appointment confirmation
        await emailQueue.add(emailQueueName, { to: patient!.email, subject: "Appointment Scheduled", body: emailBody });

        //email format used from appointment-reminder.ejs file
        const reminderBody = await renderEmailEjs("appointment-reminder", { name: patient!.name, doctor: doctor.name, date: payload.date, time: payload.time });
        //email added to queue for appointment reminder
        await emailQueue.add(emailQueueName, { to: patient!.email, subject: "Appointment Reminder", body: reminderBody }
            , {
                delay: delay
            }
        );

        // Save the appointment
        const appointment = await prisma.appointments.create({
            data: {
                doctorID: payload.doctorID,
                patientID: patient!.id, // Assuming the patient ID is extracted from auth middleware
                date: payload.date,
                time: payload.time,
            },
        });

        return res.json({
            message: "Appointment created successfully",
            data: appointment,
        });

    } catch (error) {
        //block for error handling

        //formatted error
        if (error instanceof ZodError) {
            const errors = formatError(error);
            return res.status(422).json({ message: "Invalid data", errors });
        }

        return res.status(500).json({ message: "something went wrong" });
    }
});

export default router;