// Adapted from shadcn/ui toast component
// https://ui.shadcn.com/docs/components/toast

import { 
  useToast as useToastOriginal,
  type Toast,
  type ToastActionElement,
  type ToasterToast 
} from "@/components/ui/toast"

export { Toast, ToastActionElement, ToasterToast }

export const useToast = useToastOriginal 