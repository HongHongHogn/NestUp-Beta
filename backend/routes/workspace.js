import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { generateBMCanvas } from '../lib/bmCanvas.js';

const router = express.Router();

/**
 * 리포트에서 프로젝트 생성 및 BM 캔버스 생성
 * POST /api/workspace/create-from-report
 */
router.post('/create-from-report', requireAuth, async (req, res) => {
  try {
    const { reportId } = req.body;
    const userId = req.user.id;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: '리포트 ID가 필요합니다.',
      });
    }

    // 리포트 조회
    const report = await prisma.report.findFirst({
      where: {
        id: reportId,
        userId: userId,
      },
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: '리포트를 찾을 수 없습니다.',
      });
    }

    // 이미 프로젝트가 있는지 확인
    let project = await prisma.project.findFirst({
      where: {
        reportId: reportId,
        userId: userId,
      },
    });

    if (project) {
      // 프로젝트가 이미 있으면 BM 캔버스만 생성/업데이트
      let bmCanvas = await prisma.bMCanvas.findUnique({
        where: { projectId: project.id },
      });

      if (!bmCanvas) {
        // BM 캔버스 생성
        const bmData = await generateBMCanvas(report);
        if (!bmData) {
          return res.status(500).json({
            success: false,
            message: 'BM 캔버스 생성에 실패했습니다.',
          });
        }

        bmCanvas = await prisma.bMCanvas.create({
          data: {
            projectId: project.id,
            ...bmData,
          },
        });
      }

      return res.json({
        success: true,
        message: '프로젝트가 이미 존재합니다.',
        projectId: project.id,
        bmCanvas: bmCanvas,
      });
    }

    // 새 프로젝트 생성
    project = await prisma.project.create({
      data: {
        userId: userId,
        title: report.title,
        description: report.analysisJson?.summary || '',
        reportId: reportId,
      },
    });

    // 리포트에 프로젝트 연결
    await prisma.report.update({
      where: { id: reportId },
      data: { projectId: project.id },
    });

    // BM 캔버스 생성
    const bmData = await generateBMCanvas(report);
    if (!bmData) {
      return res.status(500).json({
        success: false,
        message: 'BM 캔버스 생성에 실패했습니다.',
      });
    }

    const bmCanvas = await prisma.bMCanvas.create({
      data: {
        projectId: project.id,
        ...bmData,
      },
    });

    res.json({
      success: true,
      message: '프로젝트와 BM 캔버스가 생성되었습니다.',
      projectId: project.id,
      bmCanvas: bmCanvas,
    });
  } catch (error) {
    console.error('Workspace creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: '프로젝트 생성 중 오류가 발생했습니다.',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

/**
 * 프로젝트 조회
 * GET /api/workspace/project/:projectId
 */
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
      include: {
        bmCanvas: true,
        gtmStrategy: true,
        mrd: true,
        reports: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      project: project,
    });
  } catch (error) {
    console.error('Project fetch error:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

/**
 * BM 캔버스 조회
 * GET /api/workspace/:projectId/bm
 */
router.get('/:projectId/bm', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.',
      });
    }

    // BM 캔버스 조회
    const bmCanvas = await prisma.bMCanvas.findUnique({
      where: { projectId: projectId },
    });

    if (!bmCanvas) {
      return res.status(404).json({
        success: false,
        message: 'BM 캔버스를 찾을 수 없습니다.',
      });
    }

    res.json({
      success: true,
      bmCanvas: bmCanvas,
    });
  } catch (error) {
    console.error('BM Canvas fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'BM 캔버스 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

/**
 * BM 캔버스 업데이트
 * PUT /api/workspace/:projectId/bm
 */
router.put('/:projectId/bm', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // 프로젝트 소유권 확인
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId: userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '프로젝트를 찾을 수 없습니다.',
      });
    }

    // BM 캔버스 업데이트
    const bmCanvas = await prisma.bMCanvas.update({
      where: { projectId: projectId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'BM 캔버스가 업데이트되었습니다.',
      bmCanvas: bmCanvas,
    });
  } catch (error) {
    console.error('BM Canvas update error:', error);
    res.status(500).json({
      success: false,
      message: 'BM 캔버스 업데이트 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

/**
 * 사용자의 모든 프로젝트 조회
 * GET /api/workspace/projects
 */
router.get('/projects', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const projects = await prisma.project.findMany({
      where: {
        userId: userId,
      },
      include: {
        bmCanvas: true,
        gtmStrategy: true,
        mrd: true,
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      projects: projects,
    });
  } catch (error) {
    console.error('Projects fetch error:', error);
    res.status(500).json({
      success: false,
      message: '프로젝트 목록 조회 중 오류가 발생했습니다.',
      error: error.message,
    });
  }
});

export default router;

