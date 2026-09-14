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

    if (!apiKey || !apiSecret) {
        console.error("Faltan CLIP_API_KEY o CLIP_API_SECRET en .env");
        return null;
    }

    const raw = `${apiKey}:${apiSecret}`;
    const base64 = Buffer.from(raw, "utf8").toString("base64");
    return `Basic ${base64}`;
}

app.post("/api/clip/create-checkout", async(req, res) => {
    try {
        const { amount, placa, folio, estado, description } = req.body;

        if (!amount || !placa || !folio) {
            return res.status(400).json({
                success: false,
                error: "Datos incompletos para crear la orden.",
            });
        }

        const clipBaseUrl = process.env.CLIP_BASE_URL;
        const authHeader = getClipAuthHeader();

        if (!clipBaseUrl || !authHeader) {
            console.error("Falta CLIP_BASE_URL o token de autenticación");
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
            payment_methods: ["oxxo"],
            allowed_payment_methods: ["oxxo"],
        };

        console.log("Body enviado a Clip:", JSON.stringify(body, null, 2));

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

        // Forzar solo OXXO agregando parámetros a la URL
        const separator = checkoutUrl.includes('?') ? '&' : '?';
        const oxxoUrl = `${checkoutUrl}${separator}payment_method=oxxo&only_oxxo=true`;

        return res.json({
            success: true,
            checkout_url: oxxoUrl,
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