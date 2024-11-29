import { Router } from "express";

export const roomRouter = Router();

roomRouter.get("/",(req,res)=>{
    res.send("Hello World")
})