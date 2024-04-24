import {Request,Response,NextFunction} from "express";
import { redisClient } from "./redisConnector";

class RateLimiter {
    redis: typeof redisClient;
    luaScript:any;
    constructor() {
        this.redis = redisClient

        this.luaScript = `
        local bucketKey = KEYS[1]
        local rate = tonumber(ARGV[1])
        local capacity = tonumber(ARGV[2])
        local currentTime = tonumber(ARGV[3])

        local bucketInfo = redis.call('HMGET', bucketKey, 'lastRefillTime' , 'tokens')
        local lastRefillTime = bucketInfo[1] or 0


        local tokensToAdd = math.min(capacity, (currentTime - lastRefillTime)/1000 * rate)
        local tokens = tonumber(bucketInfo[2] or capacity)

        tokens = math.min(capacity, tokens + tokensToAdd)


        local allowed = tokens >= 1

        if allowed then
            tokens = tokens - 1
            redis.call('HMSET', bucketKey, 'tokens', tokens,'lastRefillTime', currentTime)
        else
            redis.call('HSET', bucketKey, 'lastRefillTime', currentTime)
        end


        return allowed
    `;
    }


    async processRequest(clientId:string,threadNum:string) {
        const bucketKey = `tokenBucket:${clientId}`;
        const rate = 10; // Example refill rate
        const capacity = 10; // Example bucket capacity

        try {
            const currentTime = Date.now();
            console.log("currentTime and threadNum :- ",currentTime,threadNum);
            let options = {
                keys : [bucketKey],
                arguments : [rate.toString(),capacity.toString(),currentTime.toString()]
            }
            // let options = {}
            console.log("In processRequest :- ",clientId);
            let start = Date.now();
            const result = await this.redis.eval(this.luaScript, options);
            let end = Date.now();
            console.log(`Execution time of LuaScript: ${end - start} ms`)
            console.log("result", result);
            if(result == null)
            {
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error processing request:', error);
            throw error;
        }
    }
}

async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<any> {
    const clientId = req.headers['client-id'] as string; // Assuming client ID is passed in request headers
    const threadNum = req.headers['thread-num'] as string; // Assuming thread-num is passed in request headers

    console.log("Client-id is :- ", clientId);
    console.log("thread-num :- ",threadNum);
    if (!clientId) {
        return res.status(400).json({ error: 'Client ID is required' });
    }

    try {
        const rateLimiter = new RateLimiter();
        const allowed : any= await rateLimiter.processRequest(clientId,threadNum);
        if (!allowed) {
            return res.status(429).json({ error: 'Rate limit exceeded' });
        }
        next();
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export {rateLimitMiddleware}