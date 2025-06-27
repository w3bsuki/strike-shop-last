import dynamic from 'next/dynamic';
import React, { ComponentType } from 'react';

// Types for framer-motion components
interface MotionComponentProps {
  children?: React.ReactNode;
  [key: string]: any;
}

// Loading placeholder component
const MotionPlaceholder: React.FC<MotionComponentProps> = ({ children, ...props }) => {
  return <div {...props}>{children}</div>;
};

// Dynamic import for motion components
export const motion = new Proxy({} as any, {
  get: (target, prop: string) => {
    if (target[prop]) {
      return target[prop];
    }

    // Create dynamic component for each motion element
    target[prop] = dynamic<MotionComponentProps>(
      () =>
        import('framer-motion').then((mod) => {
          const Component = (mod.motion as any)[prop];
          return {
            default: Component,
          };
        }),
      {
        loading: () => <MotionPlaceholder />,
         // Disable SSR for animation components
      }
    );

    return target[prop];
  },
});

// Dynamic imports for other framer-motion exports
export const AnimatePresence = dynamic<any>(
  () => import('framer-motion').then((mod) => ({ default: mod.AnimatePresence })),
  {
    
  }
);

export const AnimateSharedLayout = dynamic<any>(
  () => import('framer-motion').then((mod) => ({ default: mod.AnimateSharedLayout })),
  {
    
  }
);

export const useAnimation = () => {
  const [controls, setControls] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setControls(mod.useAnimation());
    });
  }, []);
  
  return controls;
};

export const useViewportScroll = () => {
  const [scroll, setScroll] = React.useState<any>({});
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setScroll(mod.useViewportScroll());
    });
  }, []);
  
  return scroll;
};

export const useTransform = (...args: any[]) => {
  const [transformed, setTransformed] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setTransformed((mod.useTransform as any)(...args));
    });
  }, [args]);
  
  return transformed;
};

export const useSpring = (...args: any[]) => {
  const [spring, setSpring] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setSpring((mod.useSpring as any)(...args));
    });
  }, [args]);
  
  return spring;
};

export const useScroll = (options?: any) => {
  const [scroll, setScroll] = React.useState<any>({});
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setScroll(mod.useScroll(options));
    });
  }, [options]);
  
  return scroll;
};

export const useMotionValue = (initial: any) => {
  const [value, setValue] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      setValue(mod.useMotionValue(initial));
    });
  }, [initial]);
  
  return value;
};

export const useVelocity = (value: any) => {
  const [velocity, setVelocity] = React.useState<any>(null);
  
  React.useEffect(() => {
    import('framer-motion').then((mod) => {
      if (value) {
        setVelocity(mod.useVelocity(value));
      }
    });
  }, [value]);
  
  return velocity;
};