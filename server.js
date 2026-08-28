require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const translations = require('./translations');

const app = express();
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    res.sendStatus(200); 

    const body = req.body;
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const senderPhone = message.from;
        const msgText = message.text ? message.text.body.toLowerCase() : '';

        if (msgText === 'hi' || msgText === 'hello') {
            await sendReply(senderPhone, translations.EN.welcome);
        }
    }
});

async function sendReply(to, text) {
    try {
        await axios.post(
            `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
            { messaging_product: "whatsapp", to: to, text: { body: text } },
            { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
        );
    } catch (error) {}
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
