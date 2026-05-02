import { InstanceBase, InstanceStatus, TCPHelper, type SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, type VariablesSchema } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions, type ActionsSchema } from './actions.js'
import { UpdateFeedbacks, type FeedbacksSchema } from './feedbacks.js'
import { UpdatePresets } from './presets.js'

export type ModuleSchema = {
	config: ModuleConfig
	secrets: undefined
	actions: ActionsSchema
	feedbacks: FeedbacksSchema
	variables: VariablesSchema
}

export { UpgradeScripts }

export class ModuleInstance extends InstanceBase<ModuleSchema> {
	private socket: TCPHelper | undefined
	private receiveBuffer = ''
	public DestCount = 0
	public SrcCount = 0
	public GpiCount = 0
	public GpoCount = 0
	config!: ModuleConfig // Setup in init()

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: ModuleConfig): Promise<void> {
		this.config = config
		this.initTCP()
	}
	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config
		this.initTCP()
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
		UpdateActions(this)
		UpdateFeedbacks(this)
	}
	private initTCP(): void {
		if (this.socket) {
			this.socket.destroy()
			delete this.socket
		}
		this.updateStatus(InstanceStatus.Connecting)
		if (this.config.host) {
			this.socket = new TCPHelper(this.config.host, this.config.port)

			this.socket.on('status_change', (status, message) => {
				this.updateStatus(status, message)
			})

			this.socket.on('error', (err) => {
				this.updateStatus(InstanceStatus.ConnectionFailure, err.message)
				this.log('error', `Network error: ${err.message}`)
			})

			this.socket.on('data', (data) => {
				this.receiveBuffer += data.toString()

				let lineEnd = this.receiveBuffer.indexOf('\n')
				while (lineEnd !== -1) {
					const message = this.receiveBuffer.substring(0, lineEnd).trim()
					this.log('debug', `Data received: ${message}`)
					this.receiveBuffer = this.receiveBuffer.substring(lineEnd + 1)
					if (message.length > 0) {
						this.processLwrpMessage(message)
					}
					lineEnd = this.receiveBuffer.indexOf('\n')
				}
			})

			this.socket.on('connect', () => {
				this.log('info', 'Connected to LWRP Server. Sending subscriptions...')
				this.sendCommand('VER')
				this.sendCommand('IP')
				this.sendCommand('DST')
				this.sendCommand('SRC')
				this.sendCommand('ADD GPI')
				this.sendCommand('ADD GPO')
				if (!this.config.password) {
					this.sendCommand(`LOGIN ${this.config.password}`)
				} else {
					this.sendCommand('LOGIN')
				}
			})
		} else {
			this.updateStatus(InstanceStatus.BadConfig, 'Missing IP Address')
		}
	}

	public sendCommand(cmd: string): void {
		if (this.socket && this.socket.isConnected) {
			this.socket.send(`${cmd}\r\n`)
			this.log('debug', `Sending ${cmd}`)
		} else {
			this.log('error', 'Socket not connected. Command failed.')
		}
	}

	private processLwrpMessage(message: string): void {
		const parts = message.split(' ')
		const command = parts[0].toUpperCase()
		const regex = /(\w+):(?:"([^"]*)"|(\S+))/g
		const variables: Record<string, string | number | boolean> = {}
		let match
		switch (command) {
			case 'BEGIN':
			case 'END':
				break
			case 'DST': {
				const dstPort = parseInt(parts[1])
				while ((match = regex.exec(message)) !== null) {
					const key = match[1].toLowerCase()
					const value = match[2] !== undefined ? match[2] : match[3]
					if (key === 'nchn') {
						variables[`dst_${dstPort}_${key}`] = parseInt(value)
					} else if (key === 'ougn') {
						variables[`dst_${dstPort}_${key}`] = parseInt(value) / 10.0
					} else {
						variables[`dst_${dstPort}_${key}`] = value
					}
				}
				break
			}
			case 'SRC': {
				const srcPort = parseInt(parts[1])
				while ((match = regex.exec(message)) !== null) {
					const key = match[1].toLowerCase()
					const value = match[2] !== undefined ? match[2] : match[3]
					if (key === 'rtpe') {
						variables[`src_${srcPort}_${key}`] = value === '1'
					} else if (key === 'ingn') {
						variables[`src_${srcPort}_${key}`] = parseInt(value) / 10.0
					} else if (key === 'nchn') {
						variables[`src_${srcPort}_${key}`] = parseInt(value)
					} else {
						variables[`src_${srcPort}_${key}`] = value
					}
				}
				break
			}
			case 'GPI':
			case 'GPO': {
				const type = command.toLowerCase()
				const port = parseInt(parts[1])
				const states = parts[2]
				if (states && states.length >= 5) {
					this.log('debug', `${type}_${port}_raw: ${states}`)
					variables[`${type}_${port}_raw`] = states
					for (let i = 0; i < 5; i++) {
						const char = states[i]
						const pin = i + 1
						const isActive = char.toLowerCase() === 'l'
						this.log('debug', `${type}_${port}_pin_${pin}_state = ${isActive}`)
						variables[`${type}_${port}_pin_${pin}_state`] = isActive
					}
				}
				break
			}
			case 'VER': {
				while ((match = regex.exec(message)) !== null) {
					const key = match[1]
					const value = match[2] !== undefined ? match[2] : match[3]
					switch (key) {
						case 'NSRC':
							this.SrcCount = parseInt(value)
							break
						case 'NDST':
							this.DestCount = parseInt(value)
							break
						case 'NGPI':
							this.GpiCount = parseInt(value)
							break
						case 'NGPO':
							this.GpoCount = parseInt(value)
							break
					}
				}
				this.updateVariableDefinitions()
				this.updateStatus(InstanceStatus.Ok)
				break
			}
			case 'IP': {
				for (let i = 1; i < parts.length - 1; i += 2) {
					const key = parts[i]
					const value = parts[i + 1]
					switch (key) {
						case 'hostname': {
							variables['hostname'] = value
						}
					}
				}
			}
		}
		this.setVariableValues(variables)
		this.checkAllFeedbacks()
	}
}
export default ModuleInstance
