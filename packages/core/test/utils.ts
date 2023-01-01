/* c8 ignore start */
import { localhost } from '../src/chains'
import {
  createPublicClient,
  createTestClient,
  createWalletClient,
  ethereumProvider,
  http,
  webSocket,
} from '../src/clients'
import { rpc } from '../src/utils'

import type { RequestListener } from 'http'
import { createServer } from 'http'
import type { AddressInfo } from 'net'
import { RpcError } from '../src/types/eip1193'

export const accounts = [
  {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x976ea74026e726554db657fa54763abd0c3a0aa9',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
    balance: 10000000000000000000000n,
  },
  {
    address: '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
    balance: 10000000000000000000000n,
  },
  {
    address: '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
    balance: 10000000000000000000000n,
  },
] as const

export const initialBlockNumber = BigInt(
  Number(process.env.VITE_ANVIL_BLOCK_NUMBER),
)

export const localWsUrl = 'ws://127.0.0.1:8545'

export const publicClient =
  process.env.VITE_NETWORK_TRANSPORT_MODE === 'webSocket'
    ? createPublicClient({
        chain: localhost,
        pollingInterval: 1_000,
        transport: webSocket({
          url: localWsUrl,
        }),
      })
    : createPublicClient({
        chain: localhost,
        pollingInterval: 1_000,
        transport: http(),
      })

export const walletClient = createWalletClient({
  transport: ethereumProvider({
    provider: {
      on: (message: string, listener: (...args: any[]) => null) => {
        if (message === 'accountsChanged') {
          listener([accounts[0].address] as any)
        }
      },
      removeListener: () => null,
      request: async ({ method, params }: any) => {
        if (method === 'eth_requestAccounts') {
          return [accounts[0].address]
        }
        if (method === 'personal_sign') {
          method = 'eth_sign'
          params = [params[1], params[0]]
        }
        if (method === 'wallet_watchAsset') {
          if (params[0].type === 'ERC721') {
            throw new RpcError(-32602, 'Token type ERC721 not supported.')
          }
          return true
        }
        if (method === 'wallet_addEthereumChain') return null
        if (method === 'wallet_switchEthereumChain') {
          if (params[0].chainId === '0xfa') {
            throw new RpcError(-4902, 'Unrecognized chain.')
          }
          return null
        }
        if (
          method === 'wallet_getPermissions' ||
          method === 'wallet_requestPermissions'
        )
          return [
            {
              invoker: 'https://example.com',
              parentCapability: 'eth_accounts',
              caveats: [
                {
                  type: 'filterResponse',
                  value: ['0x0c54fccd2e384b4bb6f2e405bf5cbc15a017aafb'],
                },
              ],
            },
          ]

        const { result } = await rpc.http(localhost.rpcUrls.default.http[0], {
          body: {
            method,
            params,
          },
        })
        return result
      },
    },
  }),
})

export const testClient = createTestClient({
  chain: localhost,
  mode: 'anvil',
  transport: http(),
})

export function createHttpServer(
  handler: RequestListener,
): Promise<{ close: () => Promise<unknown>; url: string }> {
  const server = createServer(handler)

  const closeAsync = () =>
    new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve(undefined))),
    )

  return new Promise((resolve) => {
    server.listen(() => {
      const { port } = server.address() as AddressInfo
      resolve({ close: closeAsync, url: `http://localhost:${port}` })
    })
  })
}
/* c8 ignore stop */