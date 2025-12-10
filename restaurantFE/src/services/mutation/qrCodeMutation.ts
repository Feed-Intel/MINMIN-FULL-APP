import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryFunction,
  MutationFunction,
} from '@tanstack/react-query';
import { deleteQRCode, getQRCodes } from '../api/qrCodeApi';
import { QRCodeType } from '@/types/qrCodeType';
import { hideLoader, showLoader } from '@/lib/reduxStore/loaderSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/lib/reduxStore/store';

const qrCodeKeys = {
  all: ['qrCodes'] as const,
  lists: () => [...qrCodeKeys.all, 'list'] as const,
};

export const useGetQRCodes = () => {
  const queryKey = qrCodeKeys.lists();
  const queryFn: QueryFunction<QRCodeType[], typeof queryKey> = () =>
    getQRCodes();

  return useQuery({
    queryKey,
    queryFn,
  });
};

export const useDeleteQRCode = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();

  const mutationFn: MutationFunction<any, string> = (id) => deleteQRCode(id);

  return useMutation({
    mutationFn,
    onMutate: () => dispatch(showLoader()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qrCodeKeys.lists() });
    },
    onError: (err) => {
      console.error('Error deleting QR Code:', err);
    },
    onSettled: () => dispatch(hideLoader()),
  });
};
