import { cva } from "class-variance-authority"

export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-10 w-max items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-accent hover:text-ocean-600 dark:hover:text-ocean-400 focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
)