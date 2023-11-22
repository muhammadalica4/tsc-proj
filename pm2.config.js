module.exports = {
    apps: [{
        name: 'separate_companian',
        script: './build/index.js',
        env_development: {
            NODE_ENV: 'development',
        },
        env_production: {
            NODE_ENV: 'production',
        }
    }]
}
