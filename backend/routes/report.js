import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// 모든 리포트 조회
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await prisma.report.findMany({ where: { userId }, orderBy: { date: 'desc' } });
    
    res.json({
      success: true,
      reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '리포트 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 특정 리포트 조회
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const report = await prisma.report.findFirst({ where: { id, userId } });
    if (!report) {
      return res.status(404).json({ success: false, message: '리포트를 찾을 수 없습니다.' });
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '리포트 조회 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// 리포트 삭제
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 리포트가 존재하고 사용자 소유인지 확인
    const report = await prisma.report.findFirst({ where: { id, userId } });
    if (!report) {
      return res.status(404).json({ success: false, message: '리포트를 찾을 수 없습니다.' });
    }
    
    // 삭제
    await prisma.report.delete({ where: { id } });
    
    res.json({
      success: true,
      message: '리포트가 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: '리포트 삭제 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

export default router;
