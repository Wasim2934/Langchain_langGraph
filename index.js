import express from "express";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv"
import { Annotation, StateGraph } from "@langchain/langgraph";
dotenv.config();

const app = express();

app.use(express.json());

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
})

const state  = Annotation.Root({
    prompt: Annotation,
    aiMsg: Annotation
})

const callLLM = async (state) => {
     const response = await llm.invoke([
        {
            role: "ai",
            content: "You are an AI assistant and your name is jarvis. You are a helpful assistant that helps the user to answer their questions"
        },
        {
            role: "human",
            content: state.prompt
        }
    ])
    return { aiMsg: response.content };
}

const graph = new StateGraph(state)
.addNode("agent", callLLM)
.addEdge("__start__", "agent")
.addEdge("agent", "__end__")
.compile()




app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await graph.invoke({prompt: input})

    return res.status(200).json({
        "ai:": response.aiMsg
    })

})

app.listen(3000, () => {
    console.log("Server is running on port 3000...");
})