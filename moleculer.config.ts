import { BrokerOptions, Errors } from "moleculer";
require("dotenv").config({ path: __dirname + "/docker-compose.env" });
import CoralogixWinston from "coralogix-logger-winston";
import { Constants as CoralogixConstants } from "coralogix-logger";

CoralogixConstants.CORALOGIX_LOG_URL = process.env.CORALOGIX_HOST;
CoralogixWinston.CoralogixTransport.configure({
	privateKey: process.env.CORALOGIX_PRIVATE_KEY,
	applicationName: process.env.LOG_NAMESPACE,
	subsystemName: process.env.SERVICEDIR ? process.env.SERVICEDIR.split("/").splice(-1)[0] : process.env.LOG_NAMESPACE,
});


/**
 * Moleculer ServiceBroker configuration file
 *
 * More info about options: https://moleculer.services/docs/0.14/broker.html#Broker-options
 *
 * Overwrite options in production:
 * ================================
 * 	You can overwrite any option with environment variables.
 * 	For example to overwrite the "logLevel", use `LOGLEVEL=warn` env var.
 * 	To overwrite a nested parameter, e.g. retryPolicy.retries, use `RETRYPOLICY_RETRIES=10` env var.
 *
 * 	To overwrite broker’s deeply nested default options, which are not presented in "moleculer.config.ts",
 * 	via environment variables, use the `MOL_` prefix and double underscore `__` for nested properties in .env file.
 * 	For example, to set the cacher prefix to `MYCACHE`, you should declare an env var as
 *  `MOL_CACHER__OPTIONS__PREFIX=MYCACHE`.
 */
const brokerConfig: BrokerOptions = {
	// Namespace of nodes to segment your nodes on the same network.
	namespace: "",
	// Unique node identifier. Must be unique in a namespace.
	nodeID: null,

	// Enable/disable logging or use custom logger. More info: https://moleculer.services/docs/0.14/logging.html
	logger: [
		{
			type: "Winston",
			options: {
				level: "info",
				winston: {
					defaultMeta: {
						namespace: process.env.LOG_NAMESPACE,
						deployenv: "gke",
						deployment: process.env.SERVICEDIR ? process.env.SERVICEDIR.split("/").splice(-1)[0] : process.env.LOG_NAMESPACE,
					},
					// More settings: https://github.com/winstonjs/winston#creating-your-own-logger
					transports: [
						new CoralogixWinston.CoralogixTransport({
							category: "microservices",
							handleExceptions: true,
						}),
					],
				},
			},
		},
		{
			type: "Console",
			options: {
				level: "debug",
			},
		},
	],
	// Log level for built-in console logger. Available values: trace, debug, info, warn, error, fatal
	// logLevel: "info",
	// Log formatter for built-in console logger. Available values: default, simple, short. It can be also a `Function`.
	// logFormatter: "default",
	// Custom object & array printer for built-in console logger.
	// logObjectPrinter: null,

	// Define transporter.
	// More info: https://moleculer.services/docs/0.14/networking.html
	transporter: null,

	// Define a cacher.
	// More info: https://moleculer.services/docs/0.14/caching.html
	cacher: null,

	// Define a serializer.
	// Available values: "JSON", "Avro", "ProtoBuf", "MsgPack", "Notepack", "Thrift".
	// More info: https://moleculer.services/docs/0.14/networking.html
	serializer: "JSON",

	// Number of milliseconds to wait before reject a request with a RequestTimeout error. Disabled: 0
	requestTimeout: process.env.NAMESPACE ? 10 * 1000 : 0,

	// Retry policy settings. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Retry
	retryPolicy: {
		// Enable feature
		enabled: !!process.env.NAMESPACE,
		// Count of retries
		retries: 2,
		// First delay in milliseconds.
		delay: 100,
		// Maximum delay in milliseconds.
		maxDelay: 1000,
		// Backoff factor for delay. 2 means exponential backoff.
		factor: 2,
		// A function to check failed requests.
		check: (err: Errors.MoleculerRetryableError) => err && !!err.retryable,
	},

	// Limit of calling level. If it reaches the limit, broker will throw an MaxCallLevelError error.
	// (Infinite loop protection)
	maxCallLevel: 25,

	// Number of seconds to send heartbeat packet to other nodes.
	heartbeatInterval: 5,
	// Number of seconds to wait before setting node to unavailable status.
	heartbeatTimeout: 15,

	// Tracking requests and waiting for running requests before shutdowning.
	// More info: https://moleculer.services/docs/0.14/fault-tolerance.html
	tracking: {
		// Enable feature
		enabled: false,
		// Number of milliseconds to wait before shutdowning the process
		shutdownTimeout: 5000,
	},

	// Disable built-in request & emit balancer. (Transporter must support it, as well.)
	disableBalancer: false,

	// Settings of Service Registry. More info: https://moleculer.services/docs/0.14/registry.html
	registry: {
		// Define balancing strategy.
		// Available values: "RoundRobin", "Random", "CpuUsage", "Latency"
		strategy: "RoundRobin",
		// Enable local action call preferring.
		preferLocal: true,
	},

	// Settings of Circuit Breaker. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Circuit-Breaker
	circuitBreaker: {
		// Enable feature
		enabled: false,
		// Threshold value. 0.5 means that 50% should be failed for tripping.
		threshold: 0.5,
		// Minimum request count. Below it, CB does not trip.
		minRequestCount: 20,
		// Number of seconds for time window.
		windowTime: 60,
		// Number of milliseconds to switch from open to half-open state
		halfOpenTime: 10 * 1000,
		// A function to check failed requests.
		check: (err: Errors.MoleculerRetryableError) => err && err.code >= 500,
	},

	// Settings of bulkhead feature. More info: https://moleculer.services/docs/0.14/fault-tolerance.html#Bulkhead
	bulkhead: {
		// Enable feature.
		enabled: false,
		// Maximum concurrent executions.
		concurrency: 10,
		// Maximum size of queue
		maxQueueSize: 100,
	},

	// Enable parameters validation. More info: https://moleculer.services/docs/0.14/validating.html
	// Validation: true,
	// Custom Validator class for validation.
	validator: null,

	// Register internal services ("$node").
	// More info: https://moleculer.services/docs/0.14/services.html#Internal-services
	internalServices: true,
	// Register internal middlewares.
	// More info: https://moleculer.services/docs/0.14/middlewares.html#Internal-middlewares
	internalMiddlewares: true,

	// Watch the loaded services and hot reload if they changed.
	// You can also enable it in Moleculer Runner with `--hot` argument
	hotReload: false,

	// Register custom middlewares
	middlewares: [],


	// Register custom REPL commands.
	replCommands: null,

	// Enable/disable built-in metrics function. More info: https://moleculer.services/docs/0.14/metrics.html
	metrics: {
		enabled: false,
		// Available built-in reporters: "Console", "CSV", "Event", "Prometheus", "Datadog", "StatsD"
		reporter: {
			type: "Prometheus",
			options: {
				// HTTP port
				port: 3030,
				// HTTP URL path
				path: "/metrics",
				// Default labels which are appended to all metrics labels
				defaultLabels: (registry: { broker: { namespace: any; nodeID: any } }) => ({
					namespace: registry.broker.namespace,
					nodeID: registry.broker.nodeID,
				}),
			},
		},
	},

	// Enable built-in tracing function. More info: https://moleculer.services/docs/0.14/tracing.html
	tracing: {
		enabled: false,
		events: true,
		// Available built-in exporters: "Console", "Datadog", "Event", "EventLegacy", "Jaeger", "Zipkin"
		exporter: {
			type: "DatadogSimple",
			options: {
				// Datadog Agent URL
				agentUrl: process.env.DD_AGENT_URL || "http://localhost:8126",
				// Environment variable
				env: process.env.DD_ENV || null,
				// Sampling priority. More info: https://docs.datadoghq.com/tracing/guide/trace_sampling_and_storage/?tab=java#sampling-rules
				samplingPriority: "AUTO_KEEP",
				// Default tags. They will be added into all span tags.
				defaultTags: null,
				// Custom Datadog Tracer options. More info: https://datadog.github.io/dd-trace-js/#tracer-settings
				tracerOptions: {
					analytics: true,
				},
			},
		},
	},

	errorHandler: null,
};

export = brokerConfig;
