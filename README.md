# Node CAN

A Node.js CAN library supporting multiple transports & protocols, heavily inspired by [python-can](https://python-can.readthedocs.io/en/2.1.0/).

**This is an early alpha version, do not use in production.**

## Installation

```sh
npm install node-can
```

## Usage

```
const can = require('node-can');
const bus = new can.Bus('protocolName', 'transportName', options);
```

Exemple usage :

```js
const can = require('node-can');
const bus = new can.Bus('raw', 'USBCanAnalyserV7', {
	port: '/dev/tty.wchusbserial14110',
});

// Initialize bus communication
bus.run().then(() => {
	console.log('Bus ready');
	bus.on('message', console.log);
});
```

## Transports

Only `USBCanAnalyserV7 ` transport is supported as of now. `SocketCan` will be implemented soon for supporting native can interface on linux.

### USBCanAnalyserV7

This transport implement support for the [USBCanAnalyserV7](https://www.seeedstudio.com/USB-CAN-Analyzer-p-2888.html) serial to can adapter.

#### OS support

Serial communication are done with [node-serialport](https://github.com/node-serialport/node-serialport).
So it support MacOS, Linux and Windows. See [node-serialport supported environments](https://serialport.io/docs/guide-platform-support) for more informations.

#### Initialization sequence

`node-can` take care to send initialization parameters to the serial adapater, and configure it to transfert frames in normal mode (Extended frame will be supported soon).

#### USBCanAnalyserV7 usage

```js
const can = require('node-can');
const bus = new can.Bus('raw', 'USBCanAnalyserV7', {
	port: '/some/serial/port', // String, required
});
```

## Protocols

### CanOPEN

CanOPEN is not fully implemented !

#### CanOPEN Usage

```js
const can = require('node-can');
const bus = new can.Bus('canopen', 'USBCanAnalyserV7', {
	port: '/some/serial/port',
});

bus.run().then(() => {
	const applyNetworkDef = bus.protocol.dic.loadEdsFile('filepath.eds');

	// Scan for slave nodes
	bus.protocol.network.scanner.search().then((nodeIds) => {
		if (nodeIds.length) {
			// Slaves are present in network
			const node = bus.protocol.network.addNode(nodeIds[0], applyNetworkDef());

			node.pdo.read().then(() => {
				console.log(`Node ${node.id} : PDO OK`);

				// Listen for change on a given signal
				const pdoSignal = node.pdo.get('SOME_SIGNAL');
				pdoSignal.on('change', console.log);

				// Read SDO
				node.sdo.get('SOME_RECORD').get('SOME_VARIABLE').getRaw().then(console.log);

				// Write SDO
				const sdoVal = 0x01;
				node.sdo.get('SOME_RECORD').get('SOME_VARIABLE').setRaw(sdoVal).then(console.log);
			});
		} else {
			console.error('Node slave node found');
		}
	});
});
```

## TODO

- Write tests
- Write real documentation
- More comments in code
- Prepbuild library with babel at installation, instead of using `@babel/register`
- Ability to configure extended frame mode using `USBCanAnalyserV7` transport
- Create an interface to allow developers to extending protocols & transports
- Implement .kcd parser for `raw` protocol
- Implement `socket can` support (need a native interface)
- `CanOPEN` protocol
	- Ability to auto download object dictionary from a slave node
	- Implement LSS
	- PDO write
	- Implement SYNC
	- Implement TIME PRODUCER
	- Implement `xml` dictionary parser
	- Implement segment download
	- Implement block uploads / downloads
