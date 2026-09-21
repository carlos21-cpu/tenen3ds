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
    const apiKey = process.env.CLIP_API_KEY;
    const apiSecret = process.env.CLIP_API_SECRET;

    if (!apiKey) {
        console.error("Falta CLIP_API_KEY en variables de entorno");
        return null;
    }

    // Bearer token con API Key
    return `Bearer ${apiKey}`;
}


// Endpoint para recibir webhooks de Clip v2
app.post("/api/clip/webhook", (req, res) => {
    const webhookData = req.body;


    console.log("=== WEBHOOK DE CLIP v2 RECIBIDO ===");
    console.log("Tipo de evento:", webhookData.event_type || webhookData.type || "test");
    console.log("Status:", webhookData.status);
    console.log("Datos:", JSON.stringify(webhookData, null, 2));


    const eventType = webhookData.event_type || webhookData.type;
    const status = webhookData.status;


    if (eventType === "payment.completed" || status === "PAID" || webhookData.receipt_no) {
        console.log("✅ Pago completado/confirmado");
        console.log("Transaction ID:", webhookData.transaction_id || webhookData.id);
        console.log("Amount:", webhookData.amount);
        console.log("Receipt:", webhookData.receipt_no || "N/A");
    } else if (eventType === "payment.failed" || status === "FAILED") {
        console.log("❌ Pago fallido");
        console.log("Transaction ID:", webhookData.transaction_id || webhookData.id);
        console.log("Decline reason:", webhookData.decline_reason || "N/A");
    } else if (!eventType && webhookData.merchant_name === "TestMerchant") {
        console.log("🧪 Notificación de prueba de Clip");
    } else {
        console.log("📩 Otro tipo de evento:", eventType || "desconocido");
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


        const clipBaseUrl = process.env.CLIP_BASE_URL || "https://api.payclip.com";
        const authHeader = getClipAuthHeader();


        if (!authHeader) {
            console.error("Falta autenticación de Clip");
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


        const body = {
            amount: numericAmount,
            currency: "MXN",
            purchase_description: description || `Pago control vehicular ${placa} - folio ${folio}`,
            redirection_url: {
                success: `${frontendUrl}/pago-exitoso?placa=${encodeURIComponent(placa)}&folio=${encodeURIComponent(folio)}`,
                error: `${frontendUrl}/pago-error?placa=${encodeURIComponent(placa)}&folio=${encodeURIComponent(folio)}`,
                default: `${frontendUrl}/pago-default`,
            },
        };


        console.log("=== CREANDO PAGO CON CLIP v2 ===");
        console.log("Base URL:", clipBaseUrl);
        console.log("Body enviado a Clip:", JSON.stringify(body, null, 2));
        console.log("Auth Header:", authHeader ? `Bearer ${authHeader.substring(0, 20)}...` : "Sin auth");


        const clipRes = await fetch(`${clipBaseUrl}/v2/checkout`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
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
        console.log("Respuesta Clip JSON:", clipData);


        const checkoutUrl =
            clipData.checkout_url ||
            clipData.payment_request_url ||
            clipData.url;


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
            payment_request_id: clipData.payment_request_id,
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