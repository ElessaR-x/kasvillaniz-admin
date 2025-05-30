"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={`
      peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
      border-2 border-transparent transition-all duration-300 ease-in-out
      focus-visible:outline-none focus-visible:ring-2
      focus-visible:ring-blue-400 focus-visible:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200
      hover:data-[state=checked]:bg-green-600 hover:data-[state=unchecked]:bg-gray-300
      ${className}`}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={`
        pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg
        transition-all duration-300 ease-spring
        data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
        data-[state=checked]:scale-105 data-[state=unchecked]:scale-100
        ring-0
      `}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch }; 