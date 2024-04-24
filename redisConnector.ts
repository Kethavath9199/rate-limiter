import { createClient } from 'redis';

const redisHost = 'redis-12867.c330.asia-south1-1.gce.cloud.redislabs.com';
const redisPort = 12867;
const redisPassword = 'xYYCs0wnPvO5nhrHrnmWdE0QnmmKSfGh';


console.log({
    password: redisPassword,
    host: redisHost,
    port: redisPort
})


    const redisClient = createClient({
        password: redisPassword,
        socket: {
            host: redisHost,
            port: redisPort
        }
    });

    console.log("redisClient :- ",redisClient);
    redisClient.on('error', (error:any) => console.error(`Error: not connecting to REDIS SERVER: ${error}`));

    redisClient.connect().then(()=>{
        console.log(`Successfully Connected to REDIS having host ${redisHost} && port ${redisPort} && password ${redisPassword}..... `);
    }).catch(()=>{
        console.log("error occured while connecting to REDIS....");
    });

    redisClient


export { redisClient };


