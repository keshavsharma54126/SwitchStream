import { Router } from "express";
import client from "@repo/db/client";
import { userMiddleware } from "../middleware/userMiddleWare";
import { VideoSchema } from "../types";
import Queue from "bull"
import { VideoStatus } from "@prisma/client";
export const videoRouter = Router();

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

videoRouter.get("/feed",async(req:any,res:any)=>{
    try{
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const totalVideos = await client.video.count();
        const videos = await client.video.findMany({
            select: {
                id: true,
                title: true,
                thumbnail_url: true,
                views_count: true,
                creator: {
                    select: {
                        id: true,
                        username: true
                    }
                },
            },
            orderBy: {
                created_at: "desc"
            },
            skip: (page - 1) * limit,
            take: limit
        })
        return res.status(200).json({
            videos,
            totalPages: Math.ceil(totalVideos / limit),
            currentPage: page
        })
    }catch(error){
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})

videoRouter.post("/upload",userMiddleware,async(req:any,res:any)=>{
    try{
        const parsedData = VideoSchema.safeParse(req.body);
        if(!parsedData.success){
            return res.status(400).json({
                message:"Validation errors"
            })
        }
        const video = await client.video.create({
            data:{
                title:parsedData.data.title,
                description:parsedData.data.description,
                thumbnail_url:parsedData.data.thumbnailUrl,
                channelId:parsedData.data.channelId,
                category:parsedData.data.category,
                creatorId:req.user.id,
                status:VideoStatus.PENDING
            }
        })

        await videoQueue.add({
            videoId:video.id,
            videoUrl:parsedData.data.videoUrl,
            userId:req.user.id,
            videoTitle:parsedData.data.title
        })
       return res.status(200).json({
            id:video.id,
            title:video.title,
            processing_status:video.status,
            qualities:["240p","360p","720p","1080p"]
       })

    }catch(error){
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})

videoRouter.get("/:video_id",async(req:any,res:any)=>{
    try{
        const video = await client.video.findUnique({
            where:{
                id:req.params.video_id
            },
            include:{
                creator:true
            }
        })
        if(!video){
            return res.status(400).json({
                message:"Video not found"
            })
        }
        if(video.status === "PENDING"){
            return res.status(200).json({
                id:video.id,
                title:video.title,
                description:video.description,
                creator:{
                    id:video.creator.id,
                    username:video.creator.username
                },
                status:video.status,
            })
        }
        return res.status(200).json({
            id:video.id,
            title:video.title,
            description:video.description,
            creator:{
                id:video.creator.id,
                username:video.creator.username
            },
            video_urls:video.video_urls,
            views_count:video.views_count,
            status:video.status,
        })
    }catch(error){
        return res.status(500).json({
            message:"Internal server error"
        })
    }
})