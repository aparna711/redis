import express from 'express';
import { createClient } from 'redis';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' })); // Allows the frontend to communicate with the backend
app.use(express.json());
const client = createClient();
client.on('error', err => console.log('Redis Client Error', err));

await client.connect();
console.log("Connected to Redis!");

// 1. Create a short URL
// app.get('/shorten', async (req, res) => {
//     const { url, code } = req.query;
//     if (!url || !code) return res.status(400).send("Missing URL or Code");
    
//     await client.set(`url:${code}`, url);
//     await client.set(`clicks:${code}`, 0);
//     res.send(`Shortened successfully`);
// });


// This defines the /shorten "Endpoint"
app.get('/shorten', async (req, res) => {
    const { url, code } = req.query;
    //  console.log("Hi");
    if (!url || !code) {
        return res.status(400).send("Please provide both url and code");
    }

    try {
        await client.set(`url:${code}`, url);
        // await client.set(`clicks:${code}`, 0);


        // console.log(client.get(`url:${code}`));
        res.send(`Successfully shortened! Use: http://10.10.15.140:3002/${code}`);
    } catch (err) {
        res.status(500).send("Redis error: " + err.message);
    }
});

// 2. Use the short URL (Redirect)
app.get('/:code', async (req, res) => {
    const { code } = req.params;
    const originalUrl = await client.get(`url:${code}`);

    if (originalUrl) {
        await client.incr(`clicks:${code}`);
        return res.redirect(originalUrl);
    }
    res.status(404).send('URL not found');
});

// 3. Get Analytics
app.get('/stats/:code', async (req, res) => {
    console.log(`req.params.code  : ${req.params.code}` );
    
    const clicks = await client.get(`clicks:${req.params.code}`);
    res.json({ code: req.params.code, clicks: clicks || 0 });
});

app.listen(3002, '0.0.0.0',() => console.log('Server running on http://10.10.15.140:3002'));