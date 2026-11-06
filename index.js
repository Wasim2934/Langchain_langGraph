import express from "express";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv"
dotenv.config();

const app = express();

app.use(express.json());

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
})





app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await llm.invoke([
        {
            role: "ai",
            content: "You are an AI assistant and your name is jarvis. You are a helpful assistant that helps the user to answer their questions"
        },
        {
            role: "human",
            content: input
        }
    ])

    return res.status(200).json({
        "ai:": response.content
    })

})

app.listen(3000, () => {
    console.log("Server is running on port 3000...");
})