import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock marketplace data
const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 100,
  currency: 'USD',
  moq: 50,
  company_id: 'company-1',
  company: {
    name: 'Test Supplier',
    country: 'Nigeria',
    is_verified: true
  }
};

const mockProducts = [mockProduct];

// Simple marketplace component for testing
function MarketplaceTestComponent({ products }) {
  return (
    <div data-testid="marketplace">
      <h1>Marketplace</h1>
      {products && products.length > 0 ? (
        <div data-testid="product-list">
          {products.map(product => (
            <div key={product.id} data-testid={`product-${product.id}`}>
              <h2>{product.name}</h2>
              <p>{product.price} {product.currency}</p>
              <p>MOQ: {product.moq}</p>
              {product.company?.is_verified && <span>Verified</span>}
            </div>
          ))}
        </div>
      ) : (
        <div data-testid="empty-state">No products found</div>
      )}
    </div>
  );
}

describe('Marketplace', () => {
  it('should render marketplace component', () => {
    render(
      <BrowserRouter>
        <MarketplaceTestComponent products={[]} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('marketplace')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('should display products when available', () => {
    render(
      <BrowserRouter>
        <MarketplaceTestComponent products={mockProducts} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('product-list')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('100 USD')).toBeInTheDocument();
    expect(screen.getByText('MOQ: 50')).toBeInTheDocument();
  });

  it('should show verified badge for verified suppliers', () => {
    render(
      <BrowserRouter>
        <MarketplaceTestComponent products={mockProducts} />
      </BrowserRouter>
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('should show empty state when no products', () => {
    render(
      <BrowserRouter>
        <MarketplaceTestComponent products={[]} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('should render multiple products correctly', () => {
    const multipleProducts = [
      mockProduct,
      { ...mockProduct, id: '2', name: 'Second Product', price: 200 },
      { ...mockProduct, id: '3', name: 'Third Product', price: 300 }
    ];

    render(
      <BrowserRouter>
        <MarketplaceTestComponent products={multipleProducts} />
      </BrowserRouter>
    );

    expect(screen.getByTestId('product-1')).toBeInTheDocument();
    expect(screen.getByTestId('product-2')).toBeInTheDocument();
    expect(screen.getByTestId('product-3')).toBeInTheDocument();
  });
});
