const tape = require('tape')
const bn128 = require('../index.js')

tape('Curve operations', function (t) {
  t.test('successful addition', function (st) {
    let input = '0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002'
    let output = '030644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd315ed738c0e0a7c92e7845f96b2ae9c0a68a6a449e3538fc7ff3ebf7a5a18a2c4'
    st.equal(bn128.add(Buffer.from(input, 'hex')).toString('hex'), output)
    st.end()
  })

  t.test('successful multiplication', function (st) {
    let input = '000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000042'
    let output = '12e017e752e718f7d1750138f3fd97d930073164499793d9b5405a9ff30e765a11d73265f2f8035c1eb99695a20bc0e550afbc7d506f9f1a1ffcb9f0ade01454'
    st.equal(bn128.mul(Buffer.from(input, 'hex')).toString('hex'), output)
    st.end()
  })

  t.test('successful pairing #1', function (st) {
    let input = '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa'
    let output = '0000000000000000000000000000000000000000000000000000000000000001'
    st.equal(bn128.pairing(Buffer.from(input, 'hex')).toString('hex'), output)
    st.end()
  })

  t.test('successful pairing #2', function (st) {
    let input = '1c76476f4def4bb94541d57ebba1193381ffa7aa76ada664dd31c16024c43f593034dd2920f673e204fee2811c678745fc819b55d3e9d294e45c9b03a76aef41198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c21800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed090689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa'
    let output = '0000000000000000000000000000000000000000000000000000000000000000'
    st.equal(bn128.pairing(Buffer.from(input, 'hex')).toString('hex'), output)
    st.end()
  })

  t.test('successful pairing #3', function (st) {
    let input = '1c76476f4def4bb94541d57ebba1193381ffa7aa76ada664dd31c16024c43f593034dd2920f673e204fee2811c678745fc819b55d3e9d294e45c9b03a76aef41209dd15ebff5d46c4bd888e51a93cf99a7329636c63514396b4a452003a35bf704bf11ca01483bfa8b34b43561848d28905960114c8ac04049af4b6315a416782bb8324af6cfc93537a2ad1a445cfd0ca2a71acd7ac41fadbf933c2a51be344d120a2a4cf30c1bf9845f20c6fe39e07ea2cce61f0c9bb048165fe5e4de877550'
    let output = '0000000000000000000000000000000000000000000000000000000000000000'
    st.equal(bn128.pairing(Buffer.from(input, 'hex')).toString('hex'), output)
    st.end()
  })
})