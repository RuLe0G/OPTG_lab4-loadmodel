var container;
var camera, scene, renderer;
var keyboard = new THREEx.KeyboardState();
var clock = new THREE.Clock();
var N = 100;
var geometry = new THREE.Geometry();;
var keyboard;
var cursor;
var circle;
var radius = 10;
var Bdirection = 0;
var brVis = false;
var models = new Map();
//объект интерфейса и его ширина

var selected = null;

var gui = new dat.GUI();
gui.width = 300;
var lmb=false;

var mouse = { x: 0, y: 0 }; //переменная для хранения координат мыши
//массив для объектов, проверяемых на пересечение с курсором
var targetList = []; 


var objList = []; 

init();
animate();

function init()
{
    container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 4000 );

    camera.position.set(N/5, N/1, N*2);
    camera.lookAt(new THREE.Vector3(  N/2, 0.0, N/2));

    // создание направленного источника освещения
    var light = new THREE.DirectionalLight(0xffffff);
    // позиция источника освещения
    light.position.set( N/2, N/2, N/2 );
    // направление освещения
    light.target = new THREE.Object3D();
    light.target.position.set(N/2, 0, N/2 );
    scene.add(light.target);
    // включение расчёта теней
    light.castShadow = true;
    // параметры области расчёта теней
    light.shadow = new THREE.LightShadow( new THREE.PerspectiveCamera( 60, 1, 1200, 2500 ) );
    light.shadow.bias = 0.0001;
    // размер карты теней
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    scene.add( light );


    renderer = new THREE.WebGLRenderer( { antialias: false } );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setClearColor( 0x3f3f3f, 1);
    container.appendChild( renderer.domElement );
    window.addEventListener( 'resize', onWindowResize, false );


 
    renderer.domElement.addEventListener('mousedown',onDocumentMouseDown,false);
    renderer.domElement.addEventListener('mouseup',onDocumentMouseUp,false);
    renderer.domElement.addEventListener('mousemove',onDocumentMouseMove,false);
    renderer.domElement.addEventListener('wheel',onDocumentMouseScroll,false);
    renderer.domElement.addEventListener("contextmenu",function (event)
                                        {
                                            event.preventDefault();
                                        }); 


    mixer = new THREE.AnimationMixer( scene );
    CreateTerrain();
    Cursor();
    Circle();
    Gui();
    loadModel('models/Cyprys_House/', 'Cyprys_House.obj','Cyprys_House.mtl', 1,'house');
    loadModel('models/grade/', 'grade.obj','grade.mtl',0.7,'grade');
    loadModel('models/needle01/', 'needle01.obj','needle01.mtl',1.5,'needle');
    addkos("sky.jpg");

}

function addkos(texture)
{   
    var loader = new THREE.TextureLoader(); 
    var geometry = new THREE.SphereGeometry( 250, 32, 32 );

    tex = loader.load( texture );
    tex.minFilter = THREE.NearestFilter;

    //создание материала
    var material = new THREE.MeshBasicMaterial({
            map: tex,
            side: THREE.DoubleSide
            });
    

    pos = new THREE.Vector3(N/2, -50, N/2);
    sphere = new THREE.Mesh( geometry, material );
    sphere.position.copy(pos);
    scene.add( sphere ); 

}

function Cursor(){
    //параметры цилиндра: диаметр вершины, диаметр основания, высота, число сегментов
    var geometry = new THREE.CylinderGeometry( 1.5, 0, 5, 64 );
    var cyMaterial = new THREE.MeshLambertMaterial( {color: 0x888888} );
    cursor = new THREE.Mesh( geometry, cyMaterial );
    cursor.visible = false;
    scene.add( cursor );
}

function onDocumentMouseScroll( event )
{
    if (brVis == true)
    {
    if(radius>1 )
        if(event.wheelDelta < 0)
            radius--;
    if(radius<50 )
        if(event.wheelDelta > 0)
            radius++;
    circle.scale.set(radius,1,radius); 
    }
}

function onDocumentMouseMove( event ) 
{
    
    //определение позиции мыши
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
    var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
    vector.unproject(camera); 
    var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

    // создание массива для хранения объектов, с которыми пересечётся луч
    var intersects = ray.intersectObjects( targetList );

        if (brVis == true)
        {
        // если луч пересёк какой-либо объект из списка targetList
            if ( intersects.length > 0 )
            {   
                if(cursor!=null)
                {
                    cursor.position.copy(intersects[0].point);        
                    cursor.position.y += 2.5;
                    //печать списка полей объекта
                    //console.log(intersects[0]);
                }
                if(circle!=null)
                {
                    circle.position.copy(intersects[0].point);
                    circle.position.y = 0;

                    for (var i = 0; i < circle.geometry.vertices.length; i++) 
                    {
                        //получение позиции в локальной системе координат
                        var pos = new THREE.Vector3();
                        pos.copy(circle.geometry.vertices[i]);
                        //нахождение позиции в глобальной системе координат 
                        pos.applyMatrix4(circle.matrixWorld);
                        
                        var x = Math.round(pos.x);
                        var z = Math.round(pos.z);

                        if (x >= 0 && x< N && z>=0 && z < N)
                        {
                            var y = geometry.vertices[z + x * N].y ;
                            circle.geometry.vertices[i].y = y + 0.5;
                        } 
                        else
                        circle.geometry.vertices[i].y = 0;
                
                    } 
                    
                    circle.geometry.verticesNeedUpdate = true; //обновление вершин
                }
            }
        } 
        else
        {
            if ( intersects.length > 0 )
            {
                if(selected != null && lmb==true)
                {
                    var oldpos = new THREE.Vector3();
                    oldpos.copy(selected.position)

                    selected.position.copy(intersects[0].point);
                    selected.userData.box.setFromObject(selected);

                    //получение позиции центра объекта
                    var pos = new THREE.Vector3();
                    selected.userData.box.getCenter(pos);
                    //получение позиции центра объекта
                    selected.userData.cube.position.copy(pos);
                    selected.userData.obb.position.copy(pos);


                    for (var i=0; i < objList.length; i++)
                    {
                        if(selected.userData.cube != objList[i] )
                        {
                            objList[i].material.visible =false;
                            objList[i].material.color ={r:1,g:1,b:0};
                            
                            if(intersect(objList[i].userData.model.userData, selected.userData)==true)
                            {
                                console.log('1');
                                selected.position.copy(oldpos);
                                selected.userData.box.setFromObject(selected);

                                var pos = new THREE.Vector3();
                                selected.userData.box.getCenter(pos);
                                selected.userData.cube.position.copy(pos);
                                selected.userData.obb.position.copy(pos);

                                objList[i].material.visible =true;
                                objList[i].material.color ={r:1,g:0,b:0};
                            }
                        }   
                    }
                }
            }
        }
    
}

function onDocumentMouseDown( event ) {
    if (brVis == true)
    {
        if(event.which == 1)
            Bdirection = 1;
        if(event.which == 3)
            Bdirection = -1;
    } 
    else
    {
        lmb=true;
        //определение позиции мыши
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

        //создание луча, исходящего из позиции камеры и проходящего сквозь позицию курсора мыши
        var vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
        vector.unproject(camera);
        var ray = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );

        // создание массива для хранения объектов, с которыми пересечётся луч
        var intersects = ray.intersectObjects( objList, true );
        
        if ( intersects.length > 0 ){

            if(selected!=null)
            {
                selected.userData.cube.material.visible = false;
                selected = intersects[0].object.userData.model;
                selected.userData.cube.material.visible = true;
                
            }
            else
            {
                
                selected = intersects[0].object.userData.model;
                
                selected.userData.cube.material.visible = true;
            }
        }
        else
        if(selected!=null)
        {
            selected.userData.cube.material.visible = false;
            selected = null;
            
        }
        

    }
}

function onDocumentMouseUp( event ) {
    if (brVis == true)
    {
        Bdirection = 0;
    } 
    else
    {
       lmb=false;
    }
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize( window.innerWidth, window.innerHeight );
}

var a = 0.0;
var b = 0.0;
var w = 50.0;
var L = 0.0;
// В этой функции можно изменять параметры объектов и обрабатывать действия пользователя
function animate()
{
    var delta = clock.getDelta();
    if (Bdirection != 0) 
    { 
        Sbrush(Bdirection, delta);
        
    }

    a += 0.01;
    if (keyboard.pressed("left")) 
    { 
        b+=0.025;

    }   
    if (keyboard.pressed("right")) 
    { 
        b-=0.025;

    }   

    if (keyboard.pressed("up")) 
    { 
        w-=0.5;

    }   
    if (keyboard.pressed("down")) 
    { 
        w+=0.5;

    }   
    if (keyboard.pressed("l")) 
    { 
        L-=1;

    }   
    if (keyboard.pressed("o")) 
    { 
        L+=1;

    }   
    requestAnimationFrame( animate );
    render();
    var x = N/2+2*w*Math.cos(b);
    var z = N/2+2*w*Math.sin(b);
        // Установка позиции камеры
    camera.position.set(x, w, z);

    // Установка точки, на которую камера будет смотреть
    camera.lookAt(new THREE.Vector3( N/2, L, N/2));
   
}

function render()
{
    // Рисование кадра
    renderer.render( scene, camera );
}

function Circle()
{
    var material = new THREE.LineBasicMaterial( { color: 0xffff00 } );
    var segments = 128;
    var circleGeometry = new THREE.CircleGeometry( 1, segments );
    //удаление центральной вершины
    circleGeometry.vertices.shift();

    for (var i = 0; i < circleGeometry.vertices.length; i++) {
        circleGeometry.vertices[i].z = circleGeometry.vertices[i].y;
        circleGeometry.vertices[i].y = 0;
    }
    
    circle = new THREE.Line( circleGeometry, material );
    circle.scale.set(radius,1,radius);   
    circle.visible = false; 
    scene.add( circle ); 
}

function Sbrush( Bdirection, delta )
{
    for (var i = 0; i < geometry.vertices.length; i++)
    {
        var x2 = geometry.vertices[i].x;
        var z2 = geometry.vertices[i].z;
        var r = radius;
        var x1 = cursor.position.x;
        var z1 = cursor.position.z;        

        var h = r*r - (((x2 - x1) * (x2 - x1)) + ((z2-z1) * (z2-z1)))
        if(h > 0)
        {
            geometry.vertices[i].y += Math.sqrt(h) * Bdirection * delta;
        }
        
    }
    geometry.computeFaceNormals();
    geometry.computeVertexNormals(); //пересчёт нормалей
    geometry.verticesNeedUpdate = true; //обновление вершин
    geometry.normalsNeedUpdate = true; //обновление нормалей

   

}

function Gui() {
    //массив переменных, ассоциированных с интерфейсом
    var params =
    {
        Длина: 50, Ширина: 50, Высота: 50,
        Угол: 0,
        Кисть: false,
        brushmode: {'1': 0,'2':1,'3':2},
        bm: 1,
        addHouse: function() { addMesh('house') },
        addGrade: function() { addMesh('grade') },
        addNeedle: function() { addMesh('needle') },
        del: function() { delMesh() }
    };
    //создание вкладки
    var folder1 = gui.addFolder('Размер');
    //ассоциирование переменных отвечающих за масштабирование
    //в окне интерфейса они будут представлены в виде слайдера
    //минимальное значение - 1, максимальное – 100, шаг – 1
    //listen означает, что изменение переменных будет отслеживаться
        var meshSX = folder1.add( params, 'Длина' ).min(1).max(100).step(1).listen();
        var meshSY = folder1.add( params, 'Высота' ).min(1).max(100).step(1).listen();
        var meshSZ = folder1.add( params, 'Ширина' ).min(1).max(100).step(1).listen();
    //при запуске программы папка будет открыта
    folder1.open();

    //создание вкладки
    var folder2 = gui.addFolder('Поворот');
    //ассоциирование переменных отвечающих за масштабирование
    //в окне интерфейса они будут представлены в виде слайдера
    //минимальное значение - 1, максимальное – 100, шаг – 1
    //listen означает, что изменение переменных будет отслеживаться
        var RotSX = folder2.add( params, 'Угол' ).min(-180).max(180).step(1).listen();
    //при запуске программы папка будет открыта
    folder2.open();

    //описание действий совершаемых при изменении ассоциированных значений
    //meshSX.onChange(function(value) {…});
    //meshSY.onChange(function(value) {…});
    //meshSZ.onChange(function(value) {…});
    //добавление чек бокса с именем brush
  
    //добавление кнопок, при нажатии которых будут вызываться функции addMesh
    //и delMesh соответственно. Функции описываются самостоятельно.

    
    var folder3 = gui.addFolder('Добавить объект');
        folder3.add( params, 'addHouse' ).name( "Дом" );
        folder3.add( params, 'addGrade' ).name( "Забор" );
        folder3.add( params, 'addNeedle' ).name( "Ель" );
    folder3.open();

    gui.add( params, 'del' ).name( "Удалить" );

  var cubeVisible = gui.add( params, 'Кисть' ).name('Кисть').listen();
    cubeVisible.onChange(function(value)
    {
        brVis = value;
        cursor.visible = value;
        circle.visible = value;
    });
    //при запуске программы интерфейс будет раскрыт
    gui.open();
    
        
     /*  
    var pos = new THREE.Vector3();
    selected.userData.box.getCenter(pos);
    selected.userData.cube.position.copy(pos);
    selected.userData.obb.position.copy(pos);
    */
    RotSX.onChange(function(value) 
    { 
        if(selected!=null)
        {
            selected.rotateY(value/3600);
            selected.userData.cube.rotateY(value/3600);
            
        }
    });


    meshSX.onChange(function(value) {
        if(selected != null){
            selected.scale.set(value/50, params.Высота/50, params.Ширина/50);
            var size = new THREE.Vector3();
            selected.userData.box.setFromObject(selected);
            selected.userData.box.getSize(size);
            selected.userData.cube.scale.set(size.x, size.y, size.z);
            selected.userData.box.getSize(selected.userData.obb.halfSize).multiplyScalar(0.5);

            
        }
    });

    meshSY.onChange(function(value) {
        if(selected != null){
            selected.scale.set(params.Длина/50, value/50, params.Ширина/50);
            var size = new THREE.Vector3();
            selected.userData.box.setFromObject(selected);
            selected.userData.box.getSize(size);
            selected.userData.cube.scale.set(size.x, size.y, size.z);
            selected.userData.box.getSize(selected.userData.obb.halfSize).multiplyScalar(0.5);
        }
    });

    meshSZ.onChange(function(value) {
        if(selected != null){
            selected.scale.set(params.Длина/50, params.Высота/50, value/50);
            var size = new THREE.Vector3();
            selected.userData.box.setFromObject(selected);
            selected.userData.box.getSize(size);
            selected.userData.cube.scale.set(size.x, size.y, size.z);
            selected.userData.box.getSize(selected.userData.obb.halfSize).multiplyScalar(0.5);
        }
    });


}





function CreateTerrain()
{
    for (var i = 0; i < N; i++)
    for (var j = 0; j < N; j++) {


        geometry.vertices.push(new THREE.Vector3(i, 0.0, j));
    }


    for (var i = 0; i < (N-1); i++)
    for (var j = 0; j < (N-1); j++) 
    {
        var i1 = i + j*N;
        var i2 = (i+1) + j*N;
        var i3 = (i+1) + (j+1)*N;
        var i4 = i + (j+1)*N;

        geometry.faces.push(new THREE.Face3(i1, i2, i3));
        geometry.faces.push(new THREE.Face3(i1, i3, i4));


        geometry.faceVertexUvs[0].push([new THREE.Vector2(i/(N-1), j/(N-1)),
            new THREE.Vector2((i+1)/(N-1), (j)/(N-1)),
            new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1))]); 

        geometry.faceVertexUvs[0].push([new THREE.Vector2((i)/(N-1), j/(N-1)),            
            new THREE.Vector2((i+1)/(N-1), (j+1)/(N-1)),
            new THREE.Vector2((i)/(N-1), (j+1)/(N-1))
        ]);
    }

    geometry.computeFaceNormals(); 
    geometry.computeVertexNormals(); 

    var loader = new THREE.TextureLoader(); 
    var tex = loader.load( 'unnamed.jpg' );  
    
    // Режим повторения текстуры 
   // tex.wrapS = tex.wrapT = THREE.RepeatWrapping;  
    // Повторить текстуру 10х10 раз 
   // tex.repeat.set( 1, 1  ); 


    var mat = new THREE.MeshLambertMaterial({
        map:tex,
        wireframe: false,     
        side:THREE.DoubleSide 
    });  


    var mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(0.0, 0.0, 0.0);

    mesh.receiveShadow = true;
    mesh.castShadow = true;

    targetList.push(mesh);
    scene.add(mesh);

}

function loadModel(path, oname, mname,s,name)
{
 // функция, выполняемая в процессе загрузки модели (выводит процент загрузки)
    var onProgress = function ( xhr ) {
        if ( xhr.lengthComputable ) {
            var percentComplete = xhr.loaded / xhr.total * 100;
            console.log( Math.round(percentComplete, 2) + '% downloaded' );
        }
    };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var onError = function ( xhr ) { };
    // функция, выполняющая обработку ошибок, возникших в процессе загрузки
    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setPath( path );
    // функция загрузки материала
    mtlLoader.load( mname, function( materials )
    {
        materials.preload();
        var objLoader = new THREE.OBJLoader();
        objLoader.setMaterials( materials );
        objLoader.setPath( path );
        // функция загрузки модели
        objLoader.load( oname, function ( object )
        {
            object.castShadow = true;
            object.traverse( function ( child )
            {
                if ( child instanceof THREE.Mesh )
                {
                    child.castShadow = true;
                    child.parent = object;
                }
            } );
            
            object.parent = object;
                var x = Math.random() * N;
                var z = Math.random() * N;

                var y = geometry.vertices[ Math.round(z) + Math.round(x) * N].y;

                object.position.x = x;
                object.position.y = y;
                object.position.z = z;

                object.scale.set(s,s,s);
                //scene.add(object);                
                models.set(name, object);
                //models.push(object);

        }, onProgress, onError );
    });
}

function addMesh(name) 
{
    if(brVis==false)
    {
        var model = models.get(name).clone();

        var box = new THREE.Box3();

        box.setFromObject(model);

        model.userData.box = box;

        var geometry = new THREE.BoxGeometry(1,1,1);
        var material = new THREE.MeshBasicMaterial({color:0xffff00, wireframe: true});
        var cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        //получение позиции центра объекта
        var pos = new THREE.Vector3();
        model.userData.box.getCenter(pos);
        //получение размеров объекта
        var size = new THREE.Vector3();
        model.userData.box.getSize(size);

        //установка позиции и размера объекта в куб
        cube.position.copy(pos);
        cube.scale.set(size.x, size.y, size.z);

        var obb = {};
        //структура состоит из матрицы поворота, позиции и половины размера
        obb.basis = new THREE.Matrix4();
        obb.halfSize = new THREE.Vector3();
        obb.position = new THREE.Vector3();
       //получение позиции центра объекта
        box.getCenter(obb.position);
        //получение размеров объекта
        box.getSize(obb.halfSize).multiplyScalar(0.5);
        //получение матрицы поворота объекта
        obb.basis.extractRotation(model.matrixWorld);
        //структура хранится в поле userData объекта
        model.userData.obb = obb;

        model.userData.cube  = cube; 
        cube.userData.model = model;
        
        objList.push(cube);
        scene.add(model);
    }
}

function delMesh(){
    //поиск индекса эллемента link в массиве draworder
    var ind = objList.indexOf(selected);
    //если такой индекс существует, удаление одного эллемента из массива
    if (~ind) objList.splice(ind, 1);
    //удаление из сцены объекта, на который ссылается link
    scene.remove(selected); 
    scene.remove(selected.userData.cube); 
    
    delete selected.userData.obb; 
    console.log('2'); 
}

function intersect(ob1, ob2)
{
    var xAxisA = new THREE.Vector3();
    var yAxisA = new THREE.Vector3();
    var zAxisA = new THREE.Vector3();
    var xAxisB = new THREE.Vector3();
    var yAxisB = new THREE.Vector3();
    var zAxisB = new THREE.Vector3();
    var translation = new THREE.Vector3();
    var vector = new THREE.Vector3();

    var axisA = [];
    var axisB = [];
    var rotationMatrix = [ [], [], [] ];
    var rotationMatrixAbs = [ [], [], [] ];
    var _EPSILON = 1e-3;

    var halfSizeA, halfSizeB;
    var t, i;

    ob1.obb.basis.extractBasis( xAxisA, yAxisA, zAxisA );
    ob2.obb.basis.extractBasis( xAxisB, yAxisB, zAxisB );

    // push basis vectors into arrays, so you can access them via indices
    axisA.push( xAxisA, yAxisA, zAxisA );
    axisB.push( xAxisB, yAxisB, zAxisB );
    // get displacement vector
    vector.subVectors( ob2.obb.position, ob1.obb.position );
    // express the translation vector in the coordinate frame of the current
    // OBB (this)
    for ( i = 0; i < 3; i++ )
    {
    translation.setComponent( i, vector.dot( axisA[ i ] ) );
    }
    // generate a rotation matrix that transforms from world space to the
    // OBB's coordinate space
    for ( i = 0; i < 3; i++ )
    {
    for ( var j = 0; j < 3; j++ )
    {
    rotationMatrix[ i ][ j ] = axisA[ i ].dot( axisB[ j ] );
    rotationMatrixAbs[ i ][ j ] = Math.abs( rotationMatrix[ i ][ j ] ) + _EPSILON;
    }
    }
    // test the three major axes of this OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ i ][ 0 ], rotationMatrixAbs[ i ][ 1 ], rotationMatrixAbs[ i ][ 2 ]
    );
    halfSizeA = ob1.obb.halfSize.getComponent( i );
    halfSizeB = ob2.obb.halfSize.dot( vector );
    if ( Math.abs( translation.getComponent( i ) ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the three major axes of other OBB
    for ( i = 0; i < 3; i++ )
    {
    vector.set( rotationMatrixAbs[ 0 ][ i ], rotationMatrixAbs[ 1 ][ i ], rotationMatrixAbs[ 2 ][ i ] );
    halfSizeA = ob1.obb.halfSize.dot( vector );
    halfSizeB = ob2.obb.halfSize.getComponent( i );
    vector.set( rotationMatrix[ 0 ][ i ], rotationMatrix[ 1 ][ i ], rotationMatrix[ 2 ][ i ] );
    t = translation.dot( vector );
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    }
    // test the 9 different cross-axes
    // A.x <cross> B.x
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    t = translation.z * rotationMatrix[ 1 ][ 0 ] - translation.y * rotationMatrix[ 2 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.x < cross> B.y
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 1 ] - translation.y * rotationMatrix[ 2 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.x <cross> B.z
    halfSizeA = ob1.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 0 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    t = translation.z * rotationMatrix[ 1 ][ 2 ] - translation.y * rotationMatrix[ 2 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 0 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 1 ];
    t = translation.x * rotationMatrix[ 2 ][ 0 ] - translation.z * rotationMatrix[ 0 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 1 ] - translation.z * rotationMatrix[ 0 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.y <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob1.obb.halfSize.z *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 1 ][ 0 ];
    t = translation.x * rotationMatrix[ 2 ][ 2 ] - translation.z * rotationMatrix[ 0 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.x
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 0 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 0 ];
    halfSizeB = ob2.obb.halfSize.y * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 1 ];
    t = translation.y * rotationMatrix[ 0 ][ 0 ] - translation.x * rotationMatrix[ 1 ][ 0 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.y
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 1 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 1 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 2 ] + ob2.obb.halfSize.z *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 1 ] - translation.x * rotationMatrix[ 1 ][ 1 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // A.z <cross> B.z
    halfSizeA = ob1.obb.halfSize.x * rotationMatrixAbs[ 1 ][ 2 ] + ob1.obb.halfSize.y *
    rotationMatrixAbs[ 0 ][ 2 ];
    halfSizeB = ob2.obb.halfSize.x * rotationMatrixAbs[ 2 ][ 1 ] + ob2.obb.halfSize.y *
    rotationMatrixAbs[ 2 ][ 0 ];
    t = translation.y * rotationMatrix[ 0 ][ 2 ] - translation.x * rotationMatrix[ 1 ][ 2 ];
    if ( Math.abs( t ) > halfSizeA + halfSizeB )
    {
    return false;
    }
    // no separating axis exists, so the two OBB don't intersect
    return true;
}