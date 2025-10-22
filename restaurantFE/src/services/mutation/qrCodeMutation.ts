import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteQRCode, getQRCodes } from '../api/qrCodeApi';
import { QRCodeType } from '@/types/qrCodeType';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';

export const useGetQRCodes = () => {
  return useQuery<QRCodeType[]>({
    queryKey: ['qrCodes'],
    queryFn: getQRCodes,
    staleTime: 0,
    refetchOnMount: true,
  });
};

export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  return useMutation({
    mutationFn: deleteQRCode,
    onMutate: () => {
      dispatch(showLoader());
    },
    onError: (error: any) => {
      console.error('Error creating table:', error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qrCodes'] });
    },
    onSettled: async (_: any, error: any) => {
      if (error) {
        console.error(error);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['tables'] });
      }
      dispatch(hideLoader());
    },
  });
};
