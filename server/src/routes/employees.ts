import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { mapEmployeeDetail, mapEmployeeListItem } from '../utils/employeeMapper.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      ok: true,
      data: employees.map((employee) => mapEmployeeListItem(employee)),
    });
  } catch (error) {
    console.error('Error fetching employees', error);
    res.status(500).json({ ok: false, error: { message: 'Unable to load employees' } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        assignments: {
          include: {
            event: true,
          },
        },
      },
    });

    if (!employee) {
      res.status(404).json({ ok: false, error: { message: 'Employee not found' } });
      return;
    }

    res.json({ ok: true, data: mapEmployeeDetail(employee) });
  } catch (error) {
    console.error('Error fetching employee', error);
    res.status(500).json({ ok: false, error: { message: 'Unable to load employee' } });
  }
});

export default router;
