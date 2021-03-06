import { PlusOutlined } from '@ant-design/icons';
import ProDescriptions from '@ant-design/pro-descriptions';
import type { ProDescriptionsItemProps } from '@ant-design/pro-descriptions';
import { FooterToolbar, PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import { Button, Drawer, message } from 'antd';
import React, { useRef, useState } from 'react';
import EditFormModal from "./components/EditFormModal";
import type { TableListItem } from './data.d';
import { queryPage, remove, changeAccountStatus } from './service';
import JqTable from "@/components/ProTable"
import type { JqColumns } from "@/components/ProTable/data"

/**
 *  删除节点
 * @param selectedRows
 */

const handleRemove = async (ids: string) => {
  const hide = message.loading('正在删除');
  if (!ids) return true;

  try {
    await remove(ids);
    hide();
    message.success('删除成功，即将刷新');
    return true;
  } catch (error) {
    hide();
    message.error('删除失败，请重试');
    return false;
  }
};

const TableList: React.FC<{}> = () => {
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<TableListItem>();
  const [selectedRowsState, setSelectedRows] = useState<TableListItem[]>([]);
  const [editModalData, setEditModalData] = useState({ visible: false, info: {} });
  /**
   * 国际化配置
   */

  const columns: JqColumns<TableListItem>[] = [
    {
      title: '账号',
      dataIndex: 'username',
      tip: '用于登录的用户名',
      search: { transform: () => "username_like" },
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      hideInForm: true,
      code: "IS_ENABLE"
    },
    {
      title: '创建时间',
      sorter: true,
      dataIndex: 'createTime',
      valueType: 'dateTime',
    },
    {
      title: '修改时间',
      sorter: true,
      dataIndex: 'updateTime',
      valueType: 'dateTime',
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          onClick={async () => {
            await changeAccountStatus(record.id, record.status === "1" ? "0" : "1")
            message.success("操作成功")
            actionRef.current?.reloadAndRest?.();
          }}
        >
          {record.status === "1" ? "启用" : "禁用"}
        </a>,
        <a
          onClick={() => {
            setEditModalData({ info: record, visible: true });
          }}
        >
          编辑
        </a>,
        <a onClick={async () => {
          await handleRemove(record.id);
          actionRef.current?.reloadAndRest?.();
        }}>删除</a>,
      ],
    },
  ];
  return (
    <PageContainer>
      <EditFormModal
        title="账号信息"
        visible={editModalData.visible}
        data={editModalData.info}
        onCancel={() => setEditModalData({ info: {}, visible: false })}
        onOk={
          () => {
            setEditModalData({ ...editModalData, visible: false })
            actionRef?.current?.reload();
          }
        }
      />
      <JqTable
        headerTitle="账号信息"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={() => setEditModalData({ info: {}, visible: true })}>
            <PlusOutlined /> 新建
          </Button>,
        ]}
        request={(params, sorter, filter) => queryPage({ params, sorter, filter })}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => setSelectedRows(selectedRows),
        }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              已选择{' '}
              <a
                style={{
                  fontWeight: 600,
                }}
              >
                {selectedRowsState.length}
              </a>{' '}
              项 &nbsp;&nbsp;
              {/* <span>
                服务调用次数总计 {selectedRowsState.reduce((pre, item) => pre + item.callNo, 0)} 万
              </span> */}
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState.map((row) => row.id).join());
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            批量删除
          </Button>
          {/* <Button type="primary">批量审批</Button> */}
        </FooterToolbar>
      )}

      <Drawer
        width={600}
        visible={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<TableListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<TableListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
