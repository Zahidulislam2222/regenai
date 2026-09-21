import type {Config} from '@react-router/dev/config';
import {hydrogenPreset} from '@shopify/hydrogen/react-router-preset';

const hydrogen = hydrogenPreset();
const resolveHydrogenConfig = hydrogen.reactRouterConfig;

const hydrogenPresetForCurrentReactRouter: typeof hydrogen = {
  ...hydrogen,
  async reactRouterConfig(args) {
    const config = await resolveHydrogenConfig?.(args);
    if (!config) return {};
    if (!config.future) return config;

    // Hydrogen's preset still emits this stabilized option under `future`.
    // React Router 7.15+ requires it at the top level instead.
    const hydrogenFuture = {...config.future} as typeof config.future & {
      unstable_subResourceIntegrity?: boolean;
    };
    const {unstable_subResourceIntegrity, ...future} = hydrogenFuture;

    return {
      ...config,
      future,
      subResourceIntegrity:
        config.subResourceIntegrity ?? unstable_subResourceIntegrity,
    };
  },
  reactRouterConfigResolved(args) {
    // Preserve Hydrogen's CSP guard for the moved option by presenting its
    // equivalent legacy value to the preset's existing resolved hook.
    const future = {
      ...args.reactRouterConfig.future,
      unstable_subResourceIntegrity:
        args.reactRouterConfig.subResourceIntegrity,
    };
    return hydrogen.reactRouterConfigResolved?.({
      reactRouterConfig: {...args.reactRouterConfig, future},
    });
  },
};

/**
 * React Router 7 Configuration for Hydrogen
 *
 * This configuration uses the official Hydrogen preset to provide optimal
 * React Router settings for Shopify Oxygen deployment. The preset enables
 * validated performance optimizations while ensuring compatibility.
 */
export default {
  presets: [hydrogenPresetForCurrentReactRouter],
} satisfies Config;
