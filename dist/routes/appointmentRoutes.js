import { Router } from "express";
import { ZodError } from "zod";
import { formatError, renderEmailEjs } from "../helper.js";
import prisma from "../config/database.js";
import { emailQueue, emailQueueName } from "../jobs/EmailJob.js";
import authMiddleware from "../middleware/AuthMiddleware.js";
import { appointmentSchema } from "../validation/appointmentValidation.js";
const router = Router();
router.post("/createAppointment", authMiddleware, async (req, res) => {
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
        if (doctor.role !== 'doctor') {
            return res.status(403).json({
                errors: {
                    role: "The user is not authorized as a doctor"
                }
            });
        }
        //console.log(payload);
        const requestedDateTime = new Date(`${payload.date}T${payload.time}`);
        const now = new Date();
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
        const formatTime = (date) => {
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${hours}:${minutes}`;
        };
        const greater = formatTime(startRange); // Local start time in HH:mm
        const lesser = formatTime(endRange); // Local end time in HH:mm
        //console.log(greater); // Debugging logs
        //console.log(lesser);
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
        //console.log(patient);
        // Save the appointment
        const reminderTime = requestedDateTime.getTime() - 2 * 60 * 60 * 1000; //calculation of reminder time, i.e, 2 hours before the appointment
        const delay = reminderTime - Date.now(); //calculation of delay(in milliseconds) in email, reminderTime - currentTime
        //console.log(delay);
        const emailBody = await renderEmailEjs("appointment-confirm", { name: patient.name, doctor: doctor.name, date: payload.date, time: payload.time });
        await emailQueue.add(emailQueueName, { to: patient.email, subject: "appointment scheduled", body: emailBody });
        const reminderBody = await renderEmailEjs("appointment-reminder", { name: patient.name, doctor: doctor.name, date: payload.date, time: payload.time });
        await emailQueue.add(emailQueueName, { to: patient.email, subject: "appointment reminder", body: reminderBody }, {
            delay: delay
        });
        const appointment = await prisma.appointments.create({
            data: {
                doctorID: payload.doctorID,
                patientID: patient.id, // Assuming the patient ID is extracted from auth middleware
                date: payload.date,
                time: payload.time,
            },
        });
        return res.json({
            message: "Appointment created successfully",
            data: appointment,
        });
    }
    catch (error) {
        if (error instanceof ZodError) {
            const errors = formatError(error);
            return res.status(422).json({ message: "Invalid data", errors });
        }
        return res.status(500).json({ message: "something went wrong" });
    }
});
export default router;
