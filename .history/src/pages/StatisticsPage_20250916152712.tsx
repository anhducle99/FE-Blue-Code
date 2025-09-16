import { Request, Response } from "express";
import { StatisticsService } from "../services/statisticsService";

export const getDepartmentStats = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  try {
    const data = await StatisticsService.getDepartmentStats(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("❌ Lỗi getDepartmentStats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getGroupStats = async (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  try {
    const data = await StatisticsService.getGroupStats(
      startDate as string,
      endDate as string
    );
    res.json({ success: true, data });
  } catch (err: any) {
    console.error("❌ Lỗi getGroupStats:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
