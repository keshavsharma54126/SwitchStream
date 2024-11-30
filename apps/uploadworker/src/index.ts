import express from "express";
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import Queue,{Job} from "bull"
import dotenv from "dotenv";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import fs, { createWriteStream } from "fs-extra";

dotenv.config();

const app = express();

app.use(express.json())

interface VideoJobData{
    videoId:string;
    videoUrl:string;
    userId:string;
    videoTitle:string;
}

const videoQueue = new Queue<VideoJobData>("video-processing",{
    redis:{
        host:"localhost",
        port:6379
    }
});

const s3 = new S3Client({
    region:process.env.AWS_REGION as string,
    credentials:{
        accessKeyId:process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY as string
    }
})

videoQueue.process(async (job) => {
    try {
        const {videoId, videoUrl, userId,videoTitle} = job.data;
        console.log(`Processing video ${videoId} for user ${userId}`);
        //here we need to to basically get the video from the s3 bucket basically the videoUrl is the url of the s3 bucket 
        //and then we need to process the video and transcode it through ffmpeg into different qualitiy video like 360p, 720p etc and then we need to upload the processed video to the s3 bucket and then we need to update the video record in the database
        const url = new URL(videoUrl);
        const bucketName = url.hostname.split(".")[0];
        const key = url.pathname.slice(1);

        //here we are creating input and output directories ,the input directory is the directory where the video is present and the output directory is the directory where the processed video will be stored
        const inputDir= path.join(__dirname,"../input")
        const outputDir= path.join(__dirname,"../output")
        await fs.ensureDir(inputDir)
        await fs.ensureDir(outputDir)

        //Downloading the video from the s3 bucket to the input directory
        const inputPath= path.join(inputDir,videoId)
        const writeStream = fs.createWriteStream(inputPath)
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

        //processing and transcoding the videos throgh ffmpeg
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
            //now we will uplad the processed video to the s3 bucket
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
        throw error;
    }
});

app.listen(3004, () => {
  console.log("Server is running on port 3004");
});
