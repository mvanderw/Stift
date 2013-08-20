<?php

// bootstrap
require_once __DIR__.'/../vendor/autoload.php';
use Silex\Application,
	Silex\Provider\DoctrineServiceProvider,
	Silex\Provider\SessionServiceProvider,
	Silex\Provider\MonologServiceProvider,
	Symfony\Component\HttpFoundation\Request,
	Symfony\Component\HttpFoundation\Response
;
$app = new Application();
$app->register(new DoctrineServiceProvider());
$app->register(new SessionServiceProvider());
//$app->register(new MonologServiceProvider(), array('monolog.logfile' => __DIR__.'/../app.log', 'monolog.level' => 250, 'monolog.name' => 'stift'));
$app['debug'] = true;
$app['name'] = 'Stift';

// database
$app['db.options'] = array(
	'driver' => 'pdo_mysql',
	'host' => 'localhost',
	'port' => '98898',
	'dbname' => '',
	'user' => '',
	'password' => '',
);

// opauth
//require __DIR__.'/../vendor/opauth/Opauth.php';
//$Opauth = new Opauth( $config );

// routing
$app->get('/favicon.ico', function() use ($app) { header("HTTP/1.0 404 Not Found"); echo '404 not found'; exit; });
$app->get('debug', function() use ($app) { var_dump($app); exit; });
$app->get('/', function() use ($app) {
	//$app['monolog']->addWarning('got root');
	include __DIR__.'/../app/views/home.html';
	exit;
});

$app->get('/docs', function() use ($app) {
	include __DIR__.'/../app/views/docs.html';
	exit;
});

$app->get('/stift', function() use ($app) {
	// directory list
	$directory = __DIR__.'/../app/svg/';
	$filelist = array();
	$it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory));

	while($it->valid()) {
		if (!$it->isDot()) {
			$filelist[] = array($it->getSubPath(), $it->getSubPathName());
			//echo 'SubPathName: ' . $it->getSubPathName() . "\n";
			//echo 'SubPath:     ' . $it->getSubPath() . "\n";
			//echo 'Key:         ' . $it->key() . "\n\n";
		}
		$it->next();
	}
	include __DIR__.'/../app/views/app.html';
	exit;
});

$app->get('/png/{name}', function ($name) use ($app) {
	$file = __DIR__.'/../app/svg/'. preg_replace("/[^A-Za-z0-9\-\_\.]/", '', $name);
	if (!file_exists($file)) {
		//$app->abort(404, "Post $name does not exist.");
		header("HTTP/1.0 404 Not Found"); echo '404 not found'; exit;
	}

	header('Content-type: image/png');
	readfile($file);
	exit;
});

$app->get('/svg/{name}', function ($name) use ($app) {
	$name = preg_replace("/[^A-Za-z0-9\-\_\.]/", '', $name);
	$file = __DIR__.'/../app/svg/'. $name;

	if (!file_exists($file)) {
		header("HTTP/1.0 404 Not Found"); echo '404'; exit;
	}

	header('Content-type: image/svg+xml');

	// basic sanity checking
	$svg = new DOMDocument();
	$svg->loadXML(file_get_contents($file));

	// set up the root node
	$svg->documentElement->removeAttribute('x');
	$svg->documentElement->removeAttribute('y');
	$svg->documentElement->removeAttribute('id');
	$svg->documentElement->removeAttribute('xml:space');
	$svg->documentElement->removeAttribute('enable-background');
	$svg->documentElement->setAttribute('class', 'paper');
	$svg->documentElement->setAttribute('overflow', 'visible');
	$svg->documentElement->setAttribute('pointer-events', 'visiblePainted');
	$svg->documentElement->setAttribute('shape-rendering', 'geometricPrecision');
	//foreach ($svg->documentElement->attributes as $attr) { echo "Attribute '$attr->nodeName': '$attr->nodeValue'<br />"; }

	// xpath & remove unwanted nodes
	$xpath = new DOMXpath($svg);
	$xpath->registerNamespace('svg', $svg->documentElement->namespaceURI); 
	// script nodes
	foreach ($xpath->query('//svg:script') as $node) {
	   $node->parentNode->removeChild($node);
	}

	// output
	//$output = $svg->saveXML($svg->documentElement);
	//$output = preg_replace('~<(?:!DOCTYPE|/?(?:html|body))[^>]*>\s*~i', '', $svg->saveXML($svg->documentElement));
	$svg = preg_replace('/<!--.*?-->/', '', $svg->saveXML($svg->documentElement));

	$response = new Response($svg);
	$response->headers->set('Pragma', 'public');
	$response->headers->set('Content-Type', 'image/svg+xml');
	return $response;
});


// *
$app->match('{url}', function($url) {
	exit;
})->assert('url', '.+');


// OK
$app->run();
