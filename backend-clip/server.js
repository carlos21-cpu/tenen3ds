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

        const body = {
            amount: Number(amount), // ejemplo: 1762.5
            currency: "MXN",
            purchase_description: description || `Pago control vehicular ${placa} - folio ${folio}`,
            redirection_url: {
                success: `https://tu-dominio.com/pago-exitoso?placa=${placa}&folio=${folio}`,
                error: `https://tu-dominio.com/pago-error?placa=${placa}&folio=${folio}`,
                default: `https://tu-dominio.com/pago-default`,
            },
        };

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
            });
        }

        const clipData = await clipRes.json();
        console.log("Respuesta Clip JSON:", clipData);

        // La doc del Checkout v2 indica que se devuelve la URL de redirección/payment en la respuesta;
        // revisa el nombre exacto (por ejemplo checkout_url, url, etc.). [web:245][web:270]
        const checkoutUrl =
            clipData.checkout_url ||
            clipData.payment_request_url ||
            clipData.url;

        if (!checkoutUrl) {
            console.error("Clip no devolvió URL de checkout");
            return res.status(500).json({
                success: false,
                error: "Clip no devolvió una URL de checkout.",
            });
        }

        return res.json({
            success: true,
            checkout_url: checkoutUrl,
        });
    } catch (err) {
        console.error("Error create-checkout:", err);
        return res.status(500).json({
            success: false,
            error: "Error interno al crear el enlace de pago.",
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});