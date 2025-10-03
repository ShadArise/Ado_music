# app.py
from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import os

app = Flask(__name__, static_folder='static')  # Configuración explícita para carpeta estática
app.secret_key = 'tu_clave_secreta'  # Necesario para manejar sesiones

# Simulación de una base de datos de usuarios
users = {
    'fan_ado': '12345'
}

# Datos de las canciones
song_data = {
    '1': {
        'title': 'うっせぇわ (Usseewa)',
        'artist': 'Ado',
        'file': 'usseewa.mp3',
        'video': 'usseewa_video.mp4',
        'info': 'Lanzada en 2020, "Usseewa" es el sencillo debut de Ado. La canción critica la conformidad social y se convirtió en un fenómeno viral, mostrando la potente y versátil voz de Ado.'
    },
    '2': {
        'title': '踊 (Odo)',
        'artist': 'Ado',
        'file': 'odo.mp3',
        'video': 'odo_video.mp4',
        'info': '"Odo", que significa "bailar", es una canción enérgica y caótica que invita a liberarse a través del baile. Fue lanzada en 2021 y se ha utilizado en diversas campañas.'
    }
}

# Simulación de datos de letras
lyrics_data = {
    '1': {
        'jp': '''うっせぇ うっせぇ うっせぇわ
あなたが思うより健康です
全て正しい あなたが思う
正しさの押し売り 馬鹿らしい''',
        'es': '''Cállate, cállate, cállate
Estoy más sano de lo que piensas
Todo es correcto, según tú
Tu justicia impuesta es ridícula''',
        'en': '''Shut up, shut up, shut up
I'm healthier than you think
Everything is right, in your opinion
Your forced righteousness is absurd'''
    },
    '2': {
        'jp': '''踊りましょう 夜が明けるまで
カオスなリズムで 心を解き放て
全てを忘れて ただ踊れ''',
        'es': '''Bailemos hasta que amanezca
Con un ritmo caótico, libera tu corazón
Olvida todo y solo baila''',
        'en': '''Let's dance until dawn
With a chaotic rhythm, set your heart free
Forget everything and just dance'''
    }
}

top_songs = ['1', '2']  # IDs de las canciones más escuchadas

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if users.get(username) == password:
            session['user'] = username
            return redirect(url_for('home'))
    return render_template('login.html')

@app.route('/')
def home():
    if 'user' in session:
        return render_template('index.html', songs=song_data, top_songs=top_songs)
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

@app.route('/get_lyrics/<song_id>/<lang>')
def get_lyrics(song_id, lang):
    if song_id in lyrics_data and lang in lyrics_data[song_id]:
        return jsonify({'lyrics': lyrics_data[song_id][lang]})
    return jsonify({'error': 'Letras no encontradas'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))  # Para Render/Heroku
    app.run(host='0.0.0.0', port=port, debug=False)  # Debug=False en producción