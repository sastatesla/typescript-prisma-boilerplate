import { Request, Response,NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { authService } from '../services';

const AuthController = {
  async register(req: Request, res: Response, next: NextFunction) {
    const apiResponse = new ApiResponse(res);
    const { query, release } = await apiResponse.APITransactionBegin();

    try {
      const result = await authService.register(req.body);
      await apiResponse.APITransactionSucceed(query, release);
      await apiResponse.successResponse(result);
    } catch (error:any) {
      if (query && release) {
				await apiResponse.APITransactionFailed(query, release)
			}      
      next(error)

    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    const apiResponse = new ApiResponse(res);
    const { query, release } = await apiResponse.APITransactionBegin();

    try {
      const result = await authService.login(req.body.email, req.body.password);
      await apiResponse.APITransactionSucceed(query, release);
      await apiResponse.successResponse(result);
    } catch (error:any) {
      if (query && release) {
				await apiResponse.APITransactionFailed(query, release)
			}      
      next(error)

    }
  },

  async refreshTokens(req: Request, res: Response, next: NextFunction) {
    const apiResponse = new ApiResponse(res);
    const { query, release } = await apiResponse.APITransactionBegin();

    try {
      const result = await authService.refreshTokens(req.body.token);
      await apiResponse.APITransactionSucceed(query, release);
      await apiResponse.successResponse(result);
    } catch (error:any) {
      if (query && release) {
				await apiResponse.APITransactionFailed(query, release)
        await apiResponse.errorResponse({error:error.message})
			}      
      next(error)

    }
  },
};

export default AuthController;