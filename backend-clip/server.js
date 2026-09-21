import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";


dotenv.config();


const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());
app.use(express.json());


app.get("/", (_req, res) => {
    res.json({ ok: true, message: "Backend Clip funcionando" });
});


function getClipAuthHeader() {
    // Credenciales hardcodeadas temporalmente
    const apiKey = "d7f9b539-4104-4ba1-a2df-eb695ac42793";
    const apiSecret = "0cd67525-4530-46d2-86be-e04eaefe9608";

    if (!apiKey || !apiSecret) {
        console.error("Faltan credenciales de Clip");
        return null;
    }

    const raw = `${apiKey}:${apiSecret}`;
    const base64 = Buffer.from(raw, "utf8").toString("base64");
    return `Basic ${base64}`;
}


// Endpoint para recibir webhooks de Clip v3
app.post("/api/clip/webhook", (req, res) => {
    const webhookData = req.body;

    console.log("=== WEBHOOK DE CLIP v3 RECIBIDO ===");
    console.log("Fecha:", new Date().toISOString());
    console.log("Event type:", webhookData.event_type);
    console.log("Status:", webhookData.status);
    console.log("Payment ID:", webhookData.id);
    console.log("Amount:", webhookData.amount);
    console.log("Currency:", webhookData.currency);
    console.log("Decline reason:", webhookData.decline_reason || "N/A");
    console.log("Decline code:", webhookData.decline_code || "N/A");
    console.log("Decline message:", webhookData.decline_message || "N/A");
    console.log("Metadata:", webhookData.metadata || "N/A");
    console.log("Datos completos:", JSON.stringify(webhookData, null, 2));

    const eventType = webhookData.event_type;
    const status = webhookData.status;

    if (eventType === "payment.completed" || status === "PAID") {
        console.log("✅✅✅ PAGO COMPLETADO ✅✅✅");
        console.log("Payment ID:", webhookData.id);
        console.log("Amount:", webhookData.amount, webhookData.currency);
        console.log("Receipt:", webhookData.receipt_no || "N/A");
    } else if (eventType === "payment.failed" || status === "FAILED" || status === "DECLINED") {
        console.log("❌❌❌ PAGO FALLIDO/DECLINADO ❌❌❌");
        console.log("Payment ID:", webhookData.id);
        console.log("Amount:", webhookData.amount, webhookData.currency);
        console.log("RAZÓN:", webhookData.decline_reason || "No especificada");
        console.log("CÓDIGO:", webhookData.decline_code || "No especificado");
        console.log("MENSAJE:", webhookData.decline_message || "No especificado");
    } else if (status === "PENDING") {
        console.log("⏳ PAGO PENDIENTE");
        console.log("Payment ID:", webhookData.id);
        console.log("Método:", webhookData.payment_method || "No especificado");
    } else if (status === "EXPIRED") {
        console.log("⌛ PAGO EXPIRADO");
        console.log("Payment ID:", webhookData.id);
    } else {
        console.log("📩 OTRO EVENTO:", eventType || "desconocido");
    }

    res.status(200).json({ received: true });
});


app.post("/api/clip/create-checkout", async(req, res) => {
    try {
        const { amount, placa, folio, estado, description } = req.body;

        if (!amount || !placa || !folio) {
            return res.status(400).json({
                success: false,
                error: "Datos incompletos para crear la orden.",
            });
        }

        const authHeader = getClipAuthHeader();

        if (!authHeader) {
            console.error("Falta token de autenticación de Clip");
            return res.status(500).json({
                success: false,
                error: "Configuración incompleta de Clip.",
            });
        }

        const frontendUrl = process.env.FRONTEND_URL || "https://tu-dominio.com";

        const numericAmount = Number(amount);
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                error: "Monto inválido.",
            });
        }

        // Body para Clip v3
        const body = {
            amount: numericAmount,
            currency: "MXN",
            concept: description || `Pago control vehicular ${placa} - folio ${folio}`,
            redirect_urls: {
                success: `${frontendUrl}/pago-exitoso?placa=${encodeURIComponent(placa)}&folio=${encodeURIComponent(folio)}`,
                error: `${frontendUrl}/pago-error?placa=${encodeURIComponent(placa)}&folio=${encodeURIComponent(folio)}`,
                default: `${frontendUrl}/pago-default`,
            },
            metadata: {
                placa: placa,
                folio: folio,
                estado: estado || ""
            }
        };

        console.log("=== CREANDO PAGO CON CLIP v3 ===");
        console.log("Body enviado a Clip:", JSON.stringify(body, null, 2));

        // Endpoint CORRECTO para Clip v3
        const clipRes = await fetch('https://api.payclip.com/v3/payment_requests', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
                "Clip-API-Version": "3",
                accept: "application/json",
            },
            body: JSON.stringify(body),
        });

        console.log("Respuesta Clip status:", clipRes.status);

        if (!clipRes.ok) {
            const text = await clipRes.text();
            console.error("Error Clip:", clipRes.status, text);
            return res.status(502).json({
                success: false,
                error: "Error al comunicarse con Clip.",
                clipStatus: clipRes.status,
                clipBody: text,
            });
        }

        const clipData = await clipRes.json();
        console.log("Respuesta Clip JSON:", JSON.stringify(clipData, null, 2));

        const checkoutUrl = clipData.checkout_url || clipData.payment_request_url;

        if (!checkoutUrl) {
            console.error("Clip no devolvió URL de checkout", clipData);
            return res.status(500).json({
                success: false,
                error: "Clip no devolvió una URL de checkout.",
                clipData,
            });
        }

        return res.json({
            success: true,
            checkout_url: checkoutUrl,
            payment_request_id: clipData.id,
            expires_at: clipData.expires_at,
            status: clipData.status,
        });
    } catch (err) {
        console.error("Error create-checkout:", err);
        return res.status(500).json({
            success: false,
            error: "Error interno al crear el enlace de pago.",
        });
    }
});


app.get("/test-clip-url", async(_req, res) => {
    const urlsToTest = [
        "https://api-gateway.clip.mx",
        "https://api.clip.mx",
        "https://api-gateway.clip.checkout.com",
        "https://checkout-api.clip.mx",
        "https://api.checkout.com",
        "https://pago.clip.mx",
        "https://dashboard.clip.mx",
        "https://www.clip.mx",
        "https://api-sandbox.clip.mx",
        "https://sandbox-api.clip.mx",
        "https://api.payclip.com",
    ];


    const results = await Promise.all(
        urlsToTest.map(async(url) => {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 5000);
                const fetchRes = await fetch(url, {
                    method: "HEAD",
                    signal: controller.signal,
                });
                clearTimeout(timeout);
                return { url, status: fetchRes.status, ok: fetchRes.ok, error: null };
            } catch (err) {
                return { url, status: null, ok: false, error: err.message };
            }
        })
    );


    res.json({ results });
});


app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});