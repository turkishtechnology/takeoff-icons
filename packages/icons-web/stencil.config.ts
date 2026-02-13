import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'tkicons',
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
