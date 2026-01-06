module.exports = {
  packagerConfig: {
    asar: true,
    icon: './public/icon',
    extraResource: [
      './.env'
    ]
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './public/icon.png'
        }
      },
    }
  ],
};
