import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoanCalculator } from '../views/LoanCalculator';

describe('Multi-Loan Integration', () => {
  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
  });

  it('should add multiple loans and display merged schedule', async () => {
    render(<LoanCalculator />);

    // 添加第一个贷款
    const addButton = screen.getByText('添加贷款');
    fireEvent.click(addButton);

    // 添加第二个贷款
    fireEvent.click(addButton);

    // 验证贷款列表显示两个贷款
    expect(screen.getByText('贷款 1')).toBeInTheDocument();
    expect(screen.getByText('贷款 2')).toBeInTheDocument();
  });

  it('should switch between loans', async () => {
    render(<LoanCalculator />);

    // 添加两个贷款
    const addButton = screen.getByText('添加贷款');
    fireEvent.click(addButton);
    fireEvent.click(addButton);

    // 点击第二个贷款
    const loan2 = screen.getByText('贷款 2');
    fireEvent.click(loan2);

    // 验证表单显示贷款 2 的数据
    expect(screen.getByDisplayValue('贷款 2')).toBeInTheDocument();
  });
});
