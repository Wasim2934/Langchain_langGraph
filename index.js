import express from "express";
import { ChatGroq } from "@langchain/groq";
import dotenv from "dotenv"
import { Annotation, MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import {ToolNode} from "@langchain/langgraph/prebuilt";
import {TavilySearch} from "@langchain/tavily";

dotenv.config();

const app = express();

app.use(express.json());

const tools = [tool]
const toolNode = new ToolNode(tools)

const llm = new ChatGroq({
    model: "openai/gpt-oss-120b",
})



const callLLM = async (state) => {

    console.log(state);

     const response = await llm.invoke([
        {
            role: "ai",
            content: "You are an AI assistant and your name is jarvis. You are a helpful assistant that helps the user to answer their questions"
        },
        {
            role: "human",
            content: state.messages[0].content
        }
    ])
    return { messages: [response] };
}

const tool = new TavilySearch({
  maxResults: 2,
  topic: "general",
});

const shouldContinue = async (state) => {
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage.tool_calls.length > 0) {
        return "tools"
    } else {
        return "__end__"
    }
}


const graph = new StateGraph(MessagesAnnotation)
.addNode("agent", callLLM)
.addNode("tools", toolNode)
.addEdge("__start__", "agent")
.addEdge("tools", "agent")
.addConditionalEdges("agent", shouldContinue)
.compile()




app.post("/ai", async (req, res) => {
    const { input } = req.body

    const response = await graph.invoke({ messages: [
        {
            role: "user",
            content: input
        }
    ]})

    return res.status(200).json({
        "ai:": response.messages[response.messages.length - 1].content
    })

})

app.listen(3000, () => {
    console.log("Server is running on port 3000...");
})