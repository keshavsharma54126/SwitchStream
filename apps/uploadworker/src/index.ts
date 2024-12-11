
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import amqp from 'amqplib';
import dotenv from "dotenv";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import fs, { createWriteStream } from "fs-extra";


dotenv.config();



const s3 = new S3Client({
    region:process.env.AWS_REGION as string,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY as string
    }
})

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'video-processing';

async function startConsumer() {
    try {
        const connection = await amqp.connect(RABBITMQ_URL)
        const channel = await connection.createChannel()
        await channel.assertQueue(QUEUE_NAME, {
            durable: true
        })
        channel.prefetch(1)
        console.log("Connected to RabbitMQ, waiting for messages...")
        
        channel.consume(QUEUE_NAME, async (msg) => {
            if (!msg) return;
            
            try {
                const { videoId, videoUrl, userId, videoTitle } = JSON.parse(msg.content.toString());
                console.log(`Processing video ${videoId} for user ${userId}`);
                
                const url = new URL(videoUrl);
                const bucketName = url.hostname.split(".")[0];
                const key = url.pathname.slice(1);
        
                const inputDir= path.join(__dirname,"../input")
                const outputDir= path.join(__dirname,"../output")
                await fs.ensureDir(inputDir)
                await fs.ensureDir(outputDir)
        
                const inputPath= path.join(inputDir,videoId)
                const writeStream = createWriteStream(inputPath)
                const getObjectCommand = new GetObjectCommand({
                    Bucket:bucketName,
                    Key:key
                })
        
                const response = await s3.send(getObjectCommand);
                const body = response.Body;
                if(!body){
                    throw new Error("no body found in response from s3")
                }
                if (body) {
                    await new Promise((resolve, reject) => {
                        const stream = body as unknown as any;
                        stream.pipe(writeStream);
                        writeStream.on('finish', resolve);
                        writeStream.on('error', reject);
                    });
                }
        
                const qualities = [
                    {name:"360p",width:640,height:360},
                    {name:"480p",width:854,height:480},
                    {name:"720p",width:1280,height:720},
                    {name:"1080p",width:1920,height:1080}
                ]
                const processedVideos = await Promise.all(qualities.map(async(quality)=>{
                    const outputPath = path.join(outputDir,`${videoId}-${quality.name}.mp4`)
                    await new Promise((resolve,reject)=>{
                        ffmpeg(inputPath)
                        .size(`${quality.width}x${quality.height}`)
                        .videoBitrate("1000k")
                        .audioBitrate("128k")
                        .save(outputPath)
                        .on("end",resolve)
                        .on("error",reject)
                    })
                    const uplaodKey = `TranscodedUploads/${videoId}-${quality.name}.mp4`
                    const putobjectCommand = new PutObjectCommand({
                        Bucket:bucketName,
                        Key:uplaodKey,
                        Body:fs.createReadStream(outputPath)
                    })
                    await s3.send(putobjectCommand)
                    return {
                        outputPath,
                        ...quality,
                        url:`https://${bucketName}.s3.amazonaws.com/${uplaodKey}`
                    }
                }))
                await fs.remove(inputDir)
                await fs.remove(outputDir)
        
                
                return { success: true,processedVideos};
                
            } catch (error) {
                console.error('Error processing video:', error);
                channel.nack(msg, false, true);
            }
        });
    } catch (error) {
        console.error("Failed to connect to RabbitMQ", error);
        setTimeout(() => startConsumer(), 5000);
    }
}

startConsumer();

