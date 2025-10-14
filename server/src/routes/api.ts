import { Router } from 'express';
import { employeeRouter } from './employees.js';
import { eventRouter } from './events.js';
import { schedulerRouter } from './scheduler.js';

const apiRouter = Router();

apiRouter.use('/employees', employeeRouter);
apiRouter.use('/events', eventRouter);
apiRouter.use('/scheduler', schedulerRouter);

export { apiRouter };
export default apiRouter;
