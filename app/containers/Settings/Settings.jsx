// @flow
import React, { Component } from 'react'
import { forEach, map, isEqual } from 'lodash'
import fs from 'fs'
import storage from 'electron-json-storage'

import HomeButtonLink from '../../components/HomeButtonLink'
import Button from '../../components/Button'
import { EXPLORERS, MODAL_TYPES, CURRENCIES } from '../../core/constants'

import Delete from 'react-icons/lib/md/delete'

import styles from './Settings.scss'

const { dialog } = require('electron').remote

type Props = {
  setKeys: Function,
  setBlockExplorer: Function,
  explorer: string,
  setCurrency: Function,
  currency: string,
  wallets: any,
  showModal: Function,
  networkId: string,
  setNetworkId: Function,
  networks: Array<NetworkItemType>,
  privateNetworks: Array<PrivateNetworkItemType>,
  tokens: Array<TokenItemType>,
  setPrivateNetworks: Function,
  setTokens: Function
}

export default class Settings extends Component<Props> {
  componentDidMount () {
    const { setKeys } = this.props
    // eslint-disable-next-line
    storage.get('keys', (error, data) => {
      setKeys(data)
    })
  }

  componentWillReceiveProps (nextProps: Props) {
    if (!isEqual(nextProps, this.props)) {
      const { explorer, networkId, currency, privateNetworks, tokens } = nextProps
      storage.set('settings', {
        blockExplorer: explorer,
        networkId,
        currency,
        privateNetworks,
        tokens: tokens
      })
    }
  }

  saveKeyRecovery = (keys: Object) => {
    const content = JSON.stringify(keys)
    dialog.showSaveDialog({filters: [
      {
        name: 'JSON',
        extensions: ['json']
      }]}, (fileName) => {
      if (fileName === undefined) {
        return
      }
      // fileName is a string that contains the path and filename created in the save file dialog.
      fs.writeFile(fileName, content, (err) => {
        if (err) {
          window.alert('An error ocurred creating the file ' + err.message)
        }
        window.alert('The file has been succesfully saved')
      })
    })
  }

  loadKeyRecovery = () => {
    const { setKeys } = this.props
    dialog.showOpenDialog((fileNames) => {
    // fileNames is an array that contains all the selected
      if (fileNames === undefined) {
        return
      }
      const filepath = fileNames[0]
      fs.readFile(filepath, 'utf-8', (err, data) => {
        if (err) {
          window.alert('An error ocurred reading the file :' + err.message)
          return
        }
        const keys = JSON.parse(data)
        // eslint-disable-next-line
        storage.get('keys', (error, data) => {
          forEach(keys, (value, key) => {
            data[key] = value
          })
          setKeys(data)
          storage.set('keys', data)
        })
      })
    })
  }

  updateExplorerSettings = (e: Object) => {
    const { setBlockExplorer } = this.props
    const value = e.target.value
    setBlockExplorer(value)
  }

  updateCurrencySettings = (e: Object) => {
    const { setCurrency } = this.props
    const value = e.target.value
    setCurrency(value)
  }

  updateNetworkSettings = (e: Object) => {
    const { setNetworkId } = this.props
    const value = e.target.value
    setNetworkId(value)
  }

  deleteWallet = (key: string) => {
    const { setKeys, showModal } = this.props
    showModal(MODAL_TYPES.CONFIRM, {
      title: 'Confirm Delete',
      text: `Please confirm deleting saved wallet - ${key}`,
      onClick: () => {
        // eslint-disable-next-line
        storage.get('keys', (error, data) => {
          delete data[key]
          storage.set('keys', data)
          setKeys(data)
        })
      }
    })
  }

  openPrivateNetModal = () => {
    const { setPrivateNetworks, privateNetworks, showModal } = this.props
    showModal(MODAL_TYPES.PRIVATE_NET, {
      privateNetworks,
      setPrivateNetworks
    })
  }

  openTokenModal = () => {
    const { setTokens, tokens, showModal, networks, networkId } = this.props
    showModal(MODAL_TYPES.TOKEN, {
      tokens,
      networks,
      setTokens,
      networkId
    })
  }

  render () {
    const { wallets, explorer, currency, networkId, networks } = this.props
    return (
      <div id='settings'>
        <div className='description'>Manage your Neon wallet keys and settings</div>
        <div className='settingsForm'>
          <div className='settingsItem'>
            <div className='itemTitle'>Network</div>
            <select defaultValue={networkId} onChange={this.updateNetworkSettings}>
              {networks.map(({ label, id }: NetworkItemType) =>
                <option key={`networkOption${id}`} value={id}>{label}</option>
              )}
            </select>
            <Button onClick={this.openPrivateNetModal} className={styles.managePrivateNetwork}>Manage Private Networks</Button>
          </div>
          <div className='settingsItem'>
            <div className='itemTitle'>Tokens</div>
            <Button onClick={this.openTokenModal} className={styles.managePrivateNetwork}>Manage Tokens</Button>
          </div>
          <div className='settingsItem'>
            <div className='itemTitle'>Block Explorer</div>
            <select defaultValue={explorer} onChange={this.updateExplorerSettings}>
              {Object.keys(EXPLORERS).map((explorer: ExplorerType) =>
                <option key={explorer} value={EXPLORERS[explorer]}>{EXPLORERS[explorer]}</option>)
              }
            </select>
          </div>
          <div className='settingsItem'>
            <div className='itemTitle'>Currency</div>
            <select defaultValue={currency} onChange={this.updateCurrencySettings}>
              {Object.keys(CURRENCIES).map((currencyCode: string) =>
                <option value={currencyCode} key={currencyCode}>{currencyCode.toUpperCase()}</option>
              )}
            </select>
          </div>
          <div className='settingsItem'>
            <div className='itemTitle'>Saved Wallet Keys</div>
            {map(wallets, (value, key) => {
              return (
                <div className='walletList' key={`wallet${key}`}>
                  <div className='walletItem'>
                    <div className='walletName'>{key.slice(0, 20)}</div>
                    <div className='walletKey'>{value}</div>
                    <div className='deleteWallet' onClick={() => this.deleteWallet(key)}><Delete /></div>
                  </div>
                </div>
              )
            })
            }
          </div>
          <Button onClick={() => this.saveKeyRecovery(wallets)}>Export key recovery file</Button>
          <Button onClick={this.loadKeyRecovery}>Load key recovery file</Button>
        </div>
        <HomeButtonLink />
      </div>
    )
  }
}
