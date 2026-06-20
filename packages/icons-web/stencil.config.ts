import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'takeofficons',
  srcDir: 'src',
  outputTargets: [
    {
      type: 'dist',
    },
    {
      type: 'dist-custom-elements',
    },
  ],
};
