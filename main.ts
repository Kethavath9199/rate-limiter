import express,{Request,Response} from "express";
import { rateLimitMiddleware } from "./middleWare";

// Create Express.js app
const app = express();

// Use rateLimitMiddleware
app.use(rateLimitMiddleware);

// Define route handlers
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on port 3000');
});