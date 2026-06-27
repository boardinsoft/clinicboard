import { toast } from 'sonner';

type ToastOptions = NonNullable<Parameters<typeof toast.success>[1]>;

export type NotifyOptions = {
  title: string;
  description?: string;
  action?: ToastOptions['action'];
  cancel?: ToastOptions['cancel'];
  duration?: number;
  id?: string;
};

export const notify = {
  success: (opts: NotifyOptions) => toast.success(opts.title, opts),
  error: (opts: NotifyOptions) => toast.error(opts.title, opts),
  warning: (opts: NotifyOptions) => toast.warning(opts.title, opts),
  info: (opts: NotifyOptions) => toast.info(opts.title, opts),
};