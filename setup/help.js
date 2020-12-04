(function () {
   function showHelp(type){
       // console.log(type)
        switch (type) {
            case 's':
                console.log(`
    ////////////////////////// SWITCH WHITE LABEL /////////////////
    node s HANABET 
    =======> switch to HANAHA (get latest Images from domain www.HANAHA.com)
    node s HANAHA www.HANAHA.net
    =======> switch to HANAHA (get latest Images from domain www.HANAHA.net)
    ------- Note important ------
    * Remember backup Images, odds.css, menu.css, portal.css 1st if you changed them`)
                break;
            case 'c':
                console.log(`
    ////////////////////////// COPY FILES of NEW WL /////////////////
    switch.cfg.dpPath :'%USERPROFILE%\\Desktop\\Deployer\\
    node c wl HANAHA
    =======> copy 3 css file and Images folder of HANAHA to %dpPath%
    ////////////////////////// CHECK NEW WL BY NUMBER or NAME /////////////////
    node c number HANAHA
    node c num HANAHA
    node c n HANAHA 
    =======> Check default/header number of HANAHA
    node c number 129
    node c num 129
    node c n 129
    =======> Check name WL has default/header equal 129
                `)
                break;
        }
    }
    showHelp(process.argv[2])
})()