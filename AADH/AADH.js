_AddPermissions('Network');
cfg.MUI, cfg.Dark

const endpoint = 'http://currentmillis.com/time/minutes-since-unix-epoch.php';

const saveLastDate = date => app.SaveText('date', date, 'AADH');
const getLastDate = () => app.LoadText('date', '123123592020.00', 'AADH');

let info;

const setTempDate = () => {
  const tempDate = getLastDate();
  const sys = app.CreateSysProc('su');
  sys.SetOnInput(() => trySaveAndSetDate());
  sys.SetOnError(() => {
    info.SetText('Não foi possível iniciar a operação'
      + ', verifique se o acesso root foi permitido.');
    setTimeout(() => app.Exit(), 4000)
  });
  sys.Out(`date -u ${tempDate} \n`);
};

const request = async url => {
  try {
    const response = await fetch(url);
    const responseText = await response.text();
    return responseText;
  } catch (error) {
    console.log(`Não foi possível estabelecer uma conexão com o servidor'
      + ' - ${error}`);
    return error;
  }
};

const isInvalidData = number => isNaN(number) || number.length < 8;

const toAndroidDateFormat = minutesSinceUnixEpoch => {
  const fixNumber = number => number.toString().padStart(2, '0');
  const date = new Date(minutesSinceUnixEpoch * 60000);
  const month = fixNumber((date.getMonth() + 1));
  const day = fixNumber(date.getDate());
  const hours = fixNumber(date.getHours());
  const minutes = fixNumber(date.getMinutes());
  const year = date.getFullYear();
  const seconds = '.00';
  return [month, day, hours, minutes, year, seconds]
    .join('');
};

const trySaveAndSetDate = async () => {
  const data = await request(endpoint);
  const invalidData = isInvalidData(data);
  if (invalidData) {
    info.SetText('A requisição não retornou uma resposta válida'
      + ', não foi possível concluir a operação.');
    setTimeout(() => app.Exit(), 4000)
  } else {
    const date = toAndroidDateFormat(data);
    saveLastDate(date);
    setDate(date);
  }
};

const setDate = date => {
  const sys = app.CreateSysProc('su');
  sys.SetOnInput(() => {
    info.SetText('Data e hora ajustadas, encerrando...');
    setTimeout(() => app.Exit(), 4000)
  });
  sys.SetOnError(() => {
    info.SetText('Acesso root não permitido'
      + ', não foi possível concluir a operação.')
    setTimeout(() => app.Exit(), 4000)
  });
  sys.Out(`date -D -u ${date} \n`);
};

function OnStart() {
  app.EnableBackKey(false);
  app.SetScreenMode('Game');

  const color = MUI.colors.blue;
  app.InitializeUIKit(color.blue);
  app.SetStatusBarColor('#212121');
  app.SetNavBarColor('#121212');

  const lay = MUI.CreateLayout('Absolute', 'FillXY');

    const bar = MUI.CreateAppBar('AADH');
    const barHeight = bar.GetHeight();
    bar.SetTitleTextColor('#3498db');
    lay.AddChild(bar);

      const layHome = MUI.CreateLayout('Linear');
      layHome.SetSize(1, 1.5);
      layHome.SetPadding(0.1, barHeight, 0.1, 0);
      lay.AddChild(layHome);

        info = MUI.CreateTextParagraph('Iniciando...');
        info.SetTextColor('#3498db');
        info.SetMargins(0, 0.28, 0, 0);
        info.SetTextSize(24);
        layHome.AddChild(info);

  app.AddLayout(lay);
  setTimeout(() => setTempDate(), 1500);
}