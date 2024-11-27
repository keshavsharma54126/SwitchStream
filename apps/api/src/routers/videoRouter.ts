import { Router } from "express";
import client from "@repo/db/client";
export const videoRouter = Router();


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