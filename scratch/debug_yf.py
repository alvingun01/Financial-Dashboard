import yfinance as yf
tickers = ['VOO']
data = yf.download(tickers, period="1d", interval="1m", progress=False)['Close']
print(f"Data type: {type(data)}")
print(f"Data content:\n{data}")
if not data.empty:
    print(f"Last value: {data.iloc[-1]}")
else:
    print("Data is empty")
