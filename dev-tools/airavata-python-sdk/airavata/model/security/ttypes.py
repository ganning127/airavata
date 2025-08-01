#
# Autogenerated by Thrift Compiler (0.22.0)
#
# DO NOT EDIT UNLESS YOU ARE SURE THAT YOU KNOW WHAT YOU ARE DOING
#
#  options string: py:enum,type_hints
#

from __future__ import annotations
import typing
from thrift.Thrift import TType, TMessageType, TFrozenDict, TException, TApplicationException
from thrift.protocol.TProtocol import TProtocolException
from thrift.TRecursive import fix_spec
from uuid import UUID
from enum import IntEnum

import sys

from thrift.transport import TTransport
all_structs = []


class AuthzToken(object):
    """
    Attributes:
     - accessToken
     - claimsMap

    """
    thrift_spec: typing.Any = None


    def __init__(self, accessToken: str = None, claimsMap: typing.Optional[dict[str, str]] = None,):
        self.accessToken: str = accessToken
        self.claimsMap: typing.Optional[dict[str, str]] = claimsMap

    def read(self, iprot):
        if iprot._fast_decode is not None and isinstance(iprot.trans, TTransport.CReadableTransport) and self.thrift_spec is not None:
            iprot._fast_decode(self, iprot, [self.__class__, self.thrift_spec])
            return
        iprot.readStructBegin()
        while True:
            (fname, ftype, fid) = iprot.readFieldBegin()
            if ftype == TType.STOP:
                break
            if fid == 1:
                if ftype == TType.STRING:
                    self.accessToken = iprot.readString().decode('utf-8', errors='replace') if sys.version_info[0] == 2 else iprot.readString()
                else:
                    iprot.skip(ftype)
            elif fid == 2:
                if ftype == TType.MAP:
                    self.claimsMap = {}
                    (_ktype1, _vtype2, _size0) = iprot.readMapBegin()
                    for _i4 in range(_size0):
                        _key5 = iprot.readString().decode('utf-8', errors='replace') if sys.version_info[0] == 2 else iprot.readString()
                        _val6 = iprot.readString().decode('utf-8', errors='replace') if sys.version_info[0] == 2 else iprot.readString()
                        self.claimsMap[_key5] = _val6
                    iprot.readMapEnd()
                else:
                    iprot.skip(ftype)
            else:
                iprot.skip(ftype)
            iprot.readFieldEnd()
        iprot.readStructEnd()

    def write(self, oprot):
        self.validate()
        if oprot._fast_encode is not None and self.thrift_spec is not None:
            oprot.trans.write(oprot._fast_encode(self, [self.__class__, self.thrift_spec]))
            return
        oprot.writeStructBegin('AuthzToken')
        if self.accessToken is not None:
            oprot.writeFieldBegin('accessToken', TType.STRING, 1)
            oprot.writeString(self.accessToken.encode('utf-8') if sys.version_info[0] == 2 else self.accessToken)
            oprot.writeFieldEnd()
        if self.claimsMap is not None:
            oprot.writeFieldBegin('claimsMap', TType.MAP, 2)
            oprot.writeMapBegin(TType.STRING, TType.STRING, len(self.claimsMap))
            for kiter7, viter8 in self.claimsMap.items():
                oprot.writeString(kiter7.encode('utf-8') if sys.version_info[0] == 2 else kiter7)
                oprot.writeString(viter8.encode('utf-8') if sys.version_info[0] == 2 else viter8)
            oprot.writeMapEnd()
            oprot.writeFieldEnd()
        oprot.writeFieldStop()
        oprot.writeStructEnd()

    def validate(self):
        if self.accessToken is None:
            raise TProtocolException(message='Required field accessToken is unset!')
        return

    def __repr__(self):
        L = ['%s=%r' % (key, value)
             for key, value in self.__dict__.items()]
        return '%s(%s)' % (self.__class__.__name__, ', '.join(L))

    def __eq__(self, other):
        return isinstance(other, self.__class__) and self.__dict__ == other.__dict__

    def __ne__(self, other):
        return not (self == other)
all_structs.append(AuthzToken)
AuthzToken.thrift_spec = (
    None,  # 0
    (1, TType.STRING, 'accessToken', 'UTF8', None, ),  # 1
    (2, TType.MAP, 'claimsMap', (TType.STRING, 'UTF8', TType.STRING, 'UTF8', False), None, ),  # 2
)
fix_spec(all_structs)
del all_structs
